import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { visitors, sessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSessionId } from '@/lib/utils/session';

export async function POST(request: NextRequest) {
  try {
    const { consent } = await request.json();
    const sessionId = await getSessionId() || request.cookies.get('visitor_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'No session found' }, { status: 400 });
    }

    // Update all visitors in this session
    await db
      .update(visitors)
      .set({ consentGiven: consent === true })
      .where(eq(visitors.sessionId, sessionId));

    // Update session
    await db
      .update(sessions)
      .set({ consentGiven: consent === true })
      .where(eq(sessions.sessionId, sessionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating consent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
