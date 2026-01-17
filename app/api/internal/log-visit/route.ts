import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { visitors, sessions } from '@/lib/db/schema';
import { detectBot } from '@/lib/utils/bot-detection';
import { getGeoFromHeaders } from '@/lib/utils/geo';
import { calculateSessionScore, isHotSession } from '@/lib/utils/scoring';
import { hashIP, hashUserAgent } from '@/lib/utils/hash';
import { eq, desc, and } from 'drizzle-orm';

// Dynamic route to prevent static optimization
export const dynamic = 'force-dynamic';

// Note: Using Node.js runtime for Drizzle ORM compatibility
// Edge runtime is not compatible with Drizzle's Postgres driver

export async function POST(request: NextRequest) {
  // Verify internal secret
  const secret = request.headers.get('x-internal-secret');
  if (secret !== process.env.INTERNAL_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const url = request.nextUrl.searchParams.get('url') || '/';
    const method = request.nextUrl.searchParams.get('method') || 'GET';
    const headers = body.headers || {};
    const ip = body.ip || 'unknown';

    // Get or create session ID from cookie
    const sessionCookie = request.cookies.get('visitor_session');
    const sessionId = sessionCookie?.value || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Detect bot/AI
    const botDetection = detectBot(headers['user-agent'] || null, headers);
    
    // Get geo data
    const geo = getGeoFromHeaders(request.headers);

    // Calculate score factors
    const existingVisitors = await db
      .select()
      .from(visitors)
      .where(eq(visitors.sessionId, sessionId))
      .orderBy(desc(visitors.createdAt))
      .limit(100);

    const pageViews = existingVisitors.length + 1;
    const uniquePages = new Set([...existingVisitors.map(v => v.url), url]).size;
    
    let timeOnSite = 0;
    if (existingVisitors.length > 0) {
      const firstVisit = existingVisitors[existingVisitors.length - 1].createdAt;
      timeOnSite = Math.floor((Date.now() - firstVisit.getTime()) / 1000);
    }

    const score = Math.min(pageViews * 10 + uniquePages * 15 + (timeOnSite > 60 ? 20 : 0), 300);
    const hotSession = isHotSession(score, pageViews, timeOnSite);

    // Hash sensitive data for privacy
    const ipHash = hashIP(ip);
    const userAgentHash = hashUserAgent(headers['user-agent'] || null);

    // Insert visitor record
    await db.insert(visitors).values({
      sessionId,
      ipHash,
      userAgentHash,
      referer: headers['referer'] || null,
      url,
      method,
      headers: headers as any,
      country: geo.country,
      city: geo.city,
      deviceType: botDetection.deviceType,
      browser: botDetection.browser,
      os: botDetection.os,
      isBot: botDetection.isBot,
      isAI: botDetection.isAI,
      botName: botDetection.botName,
      score,
      isHotSession: hotSession,
      consentGiven: false, // Will be updated via consent API
    });

    // Update or create session
    const existingSession = await db
      .select()
      .from(sessions)
      .where(eq(sessions.sessionId, sessionId))
      .limit(1);

    if (existingSession.length > 0) {
      await db
        .update(sessions)
        .set({
          lastSeen: new Date(),
          pageViews: pageViews,
          score,
          isHot: hotSession,
          updatedAt: new Date(),
        })
        .where(eq(sessions.sessionId, sessionId));
    } else {
      await db.insert(sessions).values({
        sessionId,
        ipHash,
        userAgentHash,
        pageViews: 1,
        score,
        isHot: hotSession,
        country: geo.country,
        deviceType: botDetection.deviceType,
        consentGiven: false,
      });
    }

    // Create alerts for significant events (async, don't block)
    if (botDetection.isAI) {
      createAlert('ai_detected', 'high', 'AI Bot Detected', `AI bot detected: ${botDetection.botName || 'Unknown'}`, sessionId).catch(() => {});
    }

    if (hotSession && existingSession.length > 0 && !existingSession[0]?.isHot) {
      createAlert('hot_session', 'medium', 'Hot Session Started', `Session ${sessionId.substring(0, 8)}... is showing high engagement`, sessionId).catch(() => {});
    }

    return NextResponse.json({ success: true, sessionId });
  } catch (error) {
    console.error('Error logging visit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function createAlert(
  type: string,
  severity: string,
  title: string,
  message: string,
  sessionId: string
) {
  try {
    const { alerts } = await import('@/lib/db/schema');
    await db.insert(alerts).values({
      type,
      severity,
      title,
      message,
      sessionId,
    });
  } catch (error) {
    // Silently fail - alerts shouldn't break logging
    console.error('Error creating alert:', error);
  }
}
