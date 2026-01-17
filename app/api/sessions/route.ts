import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions } from '@/lib/db/schema';
import { desc, eq, gte, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const hotOnly = searchParams.get('hot') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = db.select().from(sessions).orderBy(desc(sessions.lastSeen)).limit(limit);

    if (hotOnly) {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      query = db
        .select()
        .from(sessions)
        .where(and(eq(sessions.isHot, true), gte(sessions.lastSeen, last24Hours)))
        .orderBy(desc(sessions.lastSeen))
        .limit(limit);
    }

    const result = await query;
    return NextResponse.json({ sessions: result });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
