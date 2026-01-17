import { NextRequest, NextResponse } from 'next/server';
import { getResetToken } from '../forgot-password/route';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const tokenData = getResetToken(token);

    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    if (Date.now() > tokenData.expiresAt) {
      return NextResponse.json({ error: 'Token expired' }, { status: 400 });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Validate token error:', error);
    return NextResponse.json({ error: 'Failed to validate token' }, { status: 500 });
  }
}
