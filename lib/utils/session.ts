import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'visitor_session';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

export async function getOrCreateSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const existingSession = cookieStore.get(SESSION_COOKIE_NAME);
  
  if (existingSession?.value) {
    return existingSession.value;
  }
  
  const newSessionId = generateSessionId();
  cookieStore.set(SESSION_COOKIE_NAME, newSessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
  });
  
  return newSessionId;
}

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  return session?.value || null;
}
