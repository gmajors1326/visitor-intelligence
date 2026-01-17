import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { alerts } from '@/lib/db/schema';
import { isNull } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Soft delete all non-deleted alerts (move to trash)
    await db
      .update(alerts)
      .set({ deletedAt: new Date() })
      .where(isNull(alerts.deletedAt));

    return NextResponse.json({ success: true, message: 'All alerts moved to trash' });
  } catch (error) {
    console.error('Error clearing alerts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
