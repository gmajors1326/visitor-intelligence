import { NextRequest, NextResponse } from 'next/server';
import { hash, compare } from 'bcryptjs';
import { getResetToken, deleteResetToken } from '../forgot-password/route';
import { checkRateLimitRedis, getClientIdentifier } from '@/lib/utils/rate-limit-redis';
import { db } from '@/lib/db';
import { adminSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// Password strength validation
function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Password must be less than 128 characters' };
  }

  // Require at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  // Require at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  // Require at least one number
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  // Require at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for password reset (5 attempts per hour)
    const clientId = getClientIdentifier(request);
    const rateLimit = await checkRateLimitRedis(`reset-password:${clientId}`, {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many reset attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password required' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Validate token
    const tokenData = getResetToken(token);

    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    if (Date.now() > tokenData.expiresAt) {
      deleteResetToken(token);
      return NextResponse.json({ error: 'Token expired' }, { status: 400 });
    }

    // Check password history (prevent reusing last 5 passwords)
    const settings = await db.select().from(adminSettings).limit(1);
    const adminConfig = settings[0];
    const passwordHistory = (adminConfig?.passwordHistory as string[]) || [];
    
    // Check if new password matches any previous password
    for (const oldHash of passwordHistory) {
      const matches = await compare(newPassword, oldHash);
      if (matches) {
        return NextResponse.json(
          { error: 'You cannot reuse a recently used password' },
          { status: 400 }
        );
      }
    }

    // Generate new password hash
    const newHash = await hash(newPassword, 10);

    // Update password history (keep last 5)
    const updatedHistory = [newHash, ...passwordHistory].slice(0, 5);

    // Update admin settings
    if (adminConfig) {
      await db
        .update(adminSettings)
        .set({
          passwordHistory: updatedHistory as any,
          lastPasswordChange: new Date(),
        })
        .where(eq(adminSettings.id, adminConfig.id));
    } else {
      await db.insert(adminSettings).values({
        passwordHistory: updatedHistory as any,
        lastPasswordChange: new Date(),
      });
    }

    // Delete used token
    deleteResetToken(token);

    // Return the new hash - user needs to update ADMIN_PASSWORD_HASH in Vercel
    return NextResponse.json({
      success: true,
      message: 'Password reset successful. Update ADMIN_PASSWORD_HASH in Vercel with the new hash below.',
      newHash: newHash,
      instructions: [
        '1. Copy the newHash value below',
        '2. Go to Vercel project settings > Environment Variables',
        '3. Update ADMIN_PASSWORD_HASH with the new hash',
        '4. Redeploy your project',
      ],
    });
  } catch (error) {
    console.error('Reset password token error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
