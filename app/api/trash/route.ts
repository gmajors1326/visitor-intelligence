import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { visitors, sessions, alerts } from '@/lib/db/schema';
import { desc, isNotNull } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get deleted visitors
    const deletedVisitors = await db
      .select()
      .from(visitors)
      .where(isNotNull(visitors.deletedAt))
      .orderBy(desc(visitors.deletedAt))
      .limit(100);

    // Get deleted sessions
    const deletedSessions = await db
      .select()
      .from(sessions)
      .where(isNotNull(sessions.deletedAt))
      .orderBy(desc(sessions.deletedAt))
      .limit(100);

    // Get deleted alerts
    const deletedAlerts = await db
      .select()
      .from(alerts)
      .where(isNotNull(alerts.deletedAt))
      .orderBy(desc(alerts.deletedAt))
      .limit(100);

    return NextResponse.json({
      visitors: deletedVisitors,
      sessions: deletedSessions,
      alerts: deletedAlerts,
    });
  } catch (error) {
    console.error('Error fetching trash:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
