import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions } from '@/lib/db/schema';
import { isNull } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Soft delete all non-deleted sessions (move to trash)
    await db
      .update(sessions)
      .set({ deletedAt: new Date() })
      .where(isNull(sessions.deletedAt));

    return NextResponse.json({ success: true, message: 'All sessions moved to trash' });
  } catch (error) {
    console.error('Error clearing sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
