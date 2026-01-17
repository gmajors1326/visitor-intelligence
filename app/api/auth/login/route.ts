import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';

// Dynamic route to prevent static optimization
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminPasswordHash) {
      return NextResponse.json(
        { error: 'Admin password not configured' },
        { status: 500 }
      );
    }

    // For development, allow a simple password check if hash starts with "dev:"
    if (adminPasswordHash.startsWith('dev:')) {
      const devPassword = adminPasswordHash.substring(4);
      if (password === devPassword) {
        const response = NextResponse.json({ success: true });
        response.cookies.set('admin_auth', 'authenticated', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
        return response;
      }
    } else {
      // Use bcrypt for production
      const isValid = await compare(password, adminPasswordHash);
      if (isValid) {
        const response = NextResponse.json({ success: true });
        response.cookies.set('admin_auth', 'authenticated', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
        return response;
      }
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
