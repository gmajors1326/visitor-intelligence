import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions, visitors } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { id, permanent } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    if (permanent === true) {
      // Permanent delete - also delete associated visitors
      const session = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
      if (session[0]?.sessionId) {
        await db.delete(visitors).where(eq(visitors.sessionId, session[0].sessionId));
      }
      await db.delete(sessions).where(eq(sessions.id, id));
      return NextResponse.json({ success: true, message: 'Session permanently deleted' });
    } else {
      // Soft delete
      await db
        .update(sessions)
        .set({ deletedAt: new Date() })
        .where(eq(sessions.id, id));
      return NextResponse.json({ success: true, message: 'Session moved to trash' });
    }
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Restore (remove deletedAt)
    await db
      .update(sessions)
      .set({ deletedAt: null })
      .where(eq(sessions.id, id));

    return NextResponse.json({ success: true, message: 'Session restored' });
  } catch (error) {
    console.error('Error restoring session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
