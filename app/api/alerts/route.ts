import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { alerts } from '@/lib/db/schema';
import { desc, eq, and } from 'drizzle-orm';

// Dynamic route to prevent static optimization
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isRead = searchParams.get('isRead');
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '50');

    const conditions = [];
    if (isRead !== null) {
      conditions.push(eq(alerts.isRead, isRead === 'true'));
    }
    if (severity) {
      conditions.push(eq(alerts.severity, severity));
    }

    let query = db.select().from(alerts).orderBy(desc(alerts.createdAt)).limit(limit);
    
    if (conditions.length > 0) {
      const result = await db
        .select()
        .from(alerts)
        .where(and(...conditions))
        .orderBy(desc(alerts.createdAt))
        .limit(limit);
      return NextResponse.json({ alerts: result });
    }

    const result = await query;
    return NextResponse.json({ alerts: result });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, isRead } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });
    }

    await db
      .update(alerts)
      .set({ isRead: isRead === true })
      .where(eq(alerts.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
