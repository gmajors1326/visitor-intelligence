import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { heatmapData } from '@/lib/db/schema';
import { getSessionId } from '@/lib/utils/session';

export async function POST(request: NextRequest) {
  try {
    const sessionId = await getSessionId() || request.cookies.get('visitor_session')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'No session found' }, { status: 400 });
    }

    const body = await request.json();
    const { url, x, y, element, eventType } = body;

    // Check if session has consent
    const { sessions } = await import('@/lib/db/schema');
    const { eq } = await import('drizzle-orm');
    
    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.sessionId, sessionId))
      .limit(1);

    if (session.length === 0 || !session[0].consentGiven) {
      return NextResponse.json({ error: 'Consent required' }, { status: 403 });
    }

    await db.insert(heatmapData).values({
      sessionId,
      url,
      x,
      y,
      element,
      eventType: eventType || 'click',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging heatmap data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    if (!url) {
      return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
    }

    const { eq } = await import('drizzle-orm');
    const data = await db
      .select()
      .from(heatmapData)
      .where(eq(heatmapData.url, url))
      .limit(1000);

    // Aggregate click data for heatmap visualization
    const aggregated = data.reduce((acc, item) => {
      if (item.x !== null && item.y !== null) {
        const key = `${Math.floor(item.x / 10) * 10},${Math.floor(item.y / 10) * 10}`;
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({ data: aggregated });
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
