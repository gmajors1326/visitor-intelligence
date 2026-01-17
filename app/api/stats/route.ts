import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { visitors, sessions, alerts } from '@/lib/db/schema';
import { eq, gte, sql, desc, count, and } from 'drizzle-orm';

// Dynamic route to prevent static optimization
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'DATABASE_URL is not configured. Please set it in Vercel environment variables.' },
        { status: 500 }
      );
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Today's stats
    const todayVisitors = await db
      .select({ count: count() })
      .from(visitors)
      .where(gte(visitors.createdAt, todayStart));

    const todaySessions = await db
      .select({ count: count() })
      .from(sessions)
      .where(gte(sessions.createdAt, todayStart));

    const todayBots = await db
      .select({ count: count() })
      .from(visitors)
      .where(and(gte(visitors.createdAt, todayStart), eq(visitors.isBot, true)));

    const todayAI = await db
      .select({ count: count() })
      .from(visitors)
      .where(and(gte(visitors.createdAt, todayStart), eq(visitors.isAI, true)));

    const hotSessions = await db
      .select({ count: count() })
      .from(sessions)
      .where(and(gte(sessions.lastSeen, last24Hours), eq(sessions.isHot, true)));

    const unreadAlerts = await db
      .select({ count: count() })
      .from(alerts)
      .where(eq(alerts.isRead, false));

    // Top pages
    const topPages = await db
      .select({
        url: visitors.url,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(visitors)
      .where(gte(visitors.createdAt, todayStart))
      .groupBy(visitors.url)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(10);

    // Top countries
    const topCountries = await db
      .select({
        country: visitors.country,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(visitors)
      .where(and(gte(visitors.createdAt, todayStart), sql`${visitors.country} IS NOT NULL`))
      .groupBy(visitors.country)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(10);

    return NextResponse.json({
      today: {
        visitors: todayVisitors[0]?.count || 0,
        sessions: todaySessions[0]?.count || 0,
        bots: todayBots[0]?.count || 0,
        ai: todayAI[0]?.count || 0,
        hotSessions: hotSessions[0]?.count || 0,
        unreadAlerts: unreadAlerts[0]?.count || 0,
      },
      topPages: topPages.map(p => ({ url: p.url, count: Number(p.count) })),
      topCountries: topCountries.map(c => ({ country: c.country, count: Number(c.count) })),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to fetch stats',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
