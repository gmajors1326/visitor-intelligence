import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { checkRateLimit, getClientIdentifier } from '@/lib/utils/rate-limit';
import { recordFailedAttempt, clearFailedAttempts, isLocked } from '@/lib/utils/account-lockout';

// Dynamic route to prevent static optimization
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);

    // Check rate limiting (5 attempts per 15 minutes)
    const rateLimit = checkRateLimit(`login:${clientId}`, {
      windowMs: 15 * 60 * 1000,
      maxRequests: 5,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many login attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
          },
        }
      );
    }

    // Check account lockout
    if (isLocked(clientId)) {
      return NextResponse.json(
        { error: 'Account temporarily locked due to too many failed attempts. Please try again later.' },
        { status: 423 }
      );
    }

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

    let isValid = false;

    // For development, allow a simple password check if hash starts with "dev:"
    if (adminPasswordHash.startsWith('dev:')) {
      const devPassword = adminPasswordHash.substring(4);
      isValid = password === devPassword;
    } else {
      // Use bcrypt for production
      isValid = await compare(password, adminPasswordHash);
    }

    if (isValid) {
      // Clear failed attempts on successful login
      clearFailedAttempts(clientId);
      
      const response = NextResponse.json({ success: true });
      response.cookies.set('admin_auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict', // Changed from 'lax' to 'strict' for better security
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return response;
    }

    // Record failed attempt
    const lockout = recordFailedAttempt(clientId);
    
    if (lockout.locked) {
      return NextResponse.json(
        {
          error: 'Account temporarily locked due to too many failed attempts. Please try again later.',
          lockedUntil: lockout.lockedUntil,
        },
        { status: 423 }
      );
    }

    // Generic error message to prevent user enumeration
    return NextResponse.json(
      { error: 'Invalid credentials' },
      {
        status: 401,
        headers: {
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        },
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
