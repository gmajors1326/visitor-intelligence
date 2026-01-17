import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { alerts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { id, permanent } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });
    }

    if (permanent === true) {
      // Permanent delete
      await db.delete(alerts).where(eq(alerts.id, id));
      return NextResponse.json({ success: true, message: 'Alert permanently deleted' });
    } else {
      // Soft delete
      await db
        .update(alerts)
        .set({ deletedAt: new Date() })
        .where(eq(alerts.id, id));
      return NextResponse.json({ success: true, message: 'Alert moved to trash' });
    }
  } catch (error) {
    console.error('Error deleting alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });
    }

    // Restore (remove deletedAt)
    await db
      .update(alerts)
      .set({ deletedAt: null })
      .where(eq(alerts.id, id));

    return NextResponse.json({ success: true, message: 'Alert restored' });
  } catch (error) {
    console.error('Error restoring alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
