import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { checkRateLimitRedis, getClientIdentifier } from '@/lib/utils/rate-limit-redis';
import { recordFailedAttempt, clearFailedAttempts, isLocked } from '@/lib/utils/account-lockout';
import { verifyCaptcha } from '@/lib/utils/captcha';
import { verifyTwoFactorToken } from '@/lib/utils/two-factor';
import { logAuthEvent } from '@/lib/utils/logging';
import { db } from '@/lib/db';
import { adminSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Dynamic route to prevent static optimization
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { password, twoFactorCode, captchaToken } = await request.json();
    const clientId = getClientIdentifier(request);
    const userAgent = request.headers.get('user-agent') || undefined;

    // Verify CAPTCHA if provided
    if (captchaToken) {
      const captchaValid = await verifyCaptcha(captchaToken);
      if (!captchaValid) {
        logAuthEvent({
          type: 'login_failure',
          ip: clientId,
          userAgent,
          details: { reason: 'captcha_failed' },
          timestamp: new Date(),
        });
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }
    }

    // Check rate limiting (5 attempts per 15 minutes)
    const rateLimit = await checkRateLimitRedis(`login:${clientId}`, {
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
      // Check if 2FA is enabled
      const settings = await db.select().from(adminSettings).limit(1);
      const adminConfig = settings[0];
      
      if (adminConfig?.twoFactorEnabled && adminConfig.twoFactorSecret) {
        // 2FA is enabled - verify code
        if (!twoFactorCode) {
          return NextResponse.json(
            { requires2FA: true, error: 'Two-factor authentication code required' },
            { status: 200 }
          );
        }

        const twoFactorValid = verifyTwoFactorToken(adminConfig.twoFactorSecret, twoFactorCode);
        
        if (!twoFactorValid) {
          // Check backup codes
          const backupCodes = (adminConfig.backupCodes as string[]) || [];
          const codeIndex = backupCodes.indexOf(twoFactorCode);
          
          if (codeIndex === -1) {
            logAuthEvent({
              type: '2fa_failure',
              ip: clientId,
              userAgent,
              timestamp: new Date(),
            });
            recordFailedAttempt(clientId);
            return NextResponse.json(
              { error: 'Invalid two-factor authentication code' },
              { status: 401 }
            );
          }

          // Remove used backup code
          backupCodes.splice(codeIndex, 1);
          await db
            .update(adminSettings)
            .set({ backupCodes: backupCodes as any })
            .where(eq(adminSettings.id, adminConfig.id));
        }

        logAuthEvent({
          type: '2fa_success',
          ip: clientId,
          userAgent,
          timestamp: new Date(),
        });
      }

      // Clear failed attempts on successful login
      clearFailedAttempts(clientId);
      
      logAuthEvent({
        type: 'login_success',
        ip: clientId,
        userAgent,
        timestamp: new Date(),
      });
      
      const response = NextResponse.json({ success: true });
      response.cookies.set('admin_auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return response;
    }

    // Record failed attempt
    const lockout = recordFailedAttempt(clientId);
    
    logAuthEvent({
      type: lockout.locked ? 'account_locked' : 'login_failure',
      ip: clientId,
      userAgent,
      timestamp: new Date(),
    });
    
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
