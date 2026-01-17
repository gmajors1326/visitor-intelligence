import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { visitors } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { id, permanent } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Visitor ID required' }, { status: 400 });
    }

    if (permanent === true) {
      // Permanent delete
      await db.delete(visitors).where(eq(visitors.id, id));
      return NextResponse.json({ success: true, message: 'Visitor permanently deleted' });
    } else {
      // Soft delete
      await db
        .update(visitors)
        .set({ deletedAt: new Date() })
        .where(eq(visitors.id, id));
      return NextResponse.json({ success: true, message: 'Visitor moved to trash' });
    }
  } catch (error) {
    console.error('Error deleting visitor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Visitor ID required' }, { status: 400 });
    }

    // Restore (remove deletedAt)
    await db
      .update(visitors)
      .set({ deletedAt: null })
      .where(eq(visitors.id, id));

    return NextResponse.json({ success: true, message: 'Visitor restored' });
  } catch (error) {
    console.error('Error restoring visitor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
