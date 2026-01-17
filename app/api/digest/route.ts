import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dailyDigests, visitors, sessions } from '@/lib/db/schema';
import { eq, gte, sql, desc, count, and } from 'drizzle-orm';

export async function POST() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if digest already exists for yesterday
    const existing = await db
      .select()
      .from(dailyDigests)
      .where(eq(dailyDigests.date, yesterday))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ message: 'Digest already exists for this date' });
    }

    // Calculate stats for yesterday
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const totalVisitors = await db
      .select({ count: count() })
      .from(visitors)
      .where(and(gte(visitors.createdAt, yesterday), sql`${visitors.createdAt} <= ${yesterdayEnd}`));

    const uniqueSessions = await db
      .select({ count: sql<number>`count(distinct ${sessions.sessionId})` })
      .from(sessions)
      .where(and(gte(sessions.createdAt, yesterday), sql`${sessions.createdAt} <= ${yesterdayEnd}`));

    const pageViews = await db
      .select({ count: count() })
      .from(visitors)
      .where(and(gte(visitors.createdAt, yesterday), sql`${visitors.createdAt} <= ${yesterdayEnd}`));

    const botsDetected = await db
      .select({ count: count() })
      .from(visitors)
      .where(and(
        gte(visitors.createdAt, yesterday),
        sql`${visitors.createdAt} <= ${yesterdayEnd}`,
        eq(visitors.isBot, true)
      ));

    const aiDetected = await db
      .select({ count: count() })
      .from(visitors)
      .where(and(
        gte(visitors.createdAt, yesterday),
        sql`${visitors.createdAt} <= ${yesterdayEnd}`,
        eq(visitors.isAI, true)
      ));

    const hotSessions = await db
      .select({ count: count() })
      .from(sessions)
      .where(and(
        gte(sessions.createdAt, yesterday),
        sql`${sessions.createdAt} <= ${yesterdayEnd}`,
        eq(sessions.isHot, true)
      ));

    // Top pages
    const topPages = await db
      .select({
        url: visitors.url,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(visitors)
      .where(and(gte(visitors.createdAt, yesterday), sql`${visitors.createdAt} <= ${yesterdayEnd}`))
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
      .where(and(
        gte(visitors.createdAt, yesterday),
        sql`${visitors.createdAt} <= ${yesterdayEnd}`,
        sql`${visitors.country} IS NOT NULL`
      ))
      .groupBy(visitors.country)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(10);

    // Top devices
    const topDevices = await db
      .select({
        deviceType: visitors.deviceType,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(visitors)
      .where(and(
        gte(visitors.createdAt, yesterday),
        sql`${visitors.createdAt} <= ${yesterdayEnd}`,
        sql`${visitors.deviceType} IS NOT NULL`
      ))
      .groupBy(visitors.deviceType)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(10);

    // Create digest
    await db.insert(dailyDigests).values({
      date: yesterday,
      totalVisitors: totalVisitors[0]?.count || 0,
      uniqueSessions: Number(uniqueSessions[0]?.count) || 0,
      pageViews: pageViews[0]?.count || 0,
      botsDetected: botsDetected[0]?.count || 0,
      aiDetected: aiDetected[0]?.count || 0,
      hotSessions: hotSessions[0]?.count || 0,
      topPages: topPages.map(p => ({ url: p.url, count: Number(p.count) })),
      topCountries: topCountries.map(c => ({ country: c.country, count: Number(c.count) })),
      topDevices: topDevices.map(d => ({ deviceType: d.deviceType, count: Number(d.count) })),
    });

    return NextResponse.json({ success: true, date: yesterday });
  } catch (error) {
    console.error('Error creating daily digest:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '30');

    const digests = await db
      .select()
      .from(dailyDigests)
      .orderBy(desc(dailyDigests.date))
      .limit(limit);

    return NextResponse.json({ digests });
  } catch (error) {
    console.error('Error fetching digests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
