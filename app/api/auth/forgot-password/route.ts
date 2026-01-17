import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import crypto from 'crypto';
import { checkRateLimit, getClientIdentifier } from '@/lib/utils/rate-limit';

export const dynamic = 'force-dynamic';

// In-memory store for reset tokens (in production, use Redis or database)
const resetTokens = new Map<string, { token: string; expiresAt: number }>();

export async function POST(request: NextRequest) {
  // Rate limiting for forgot password (3 requests per hour)
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`forgot-password:${clientId}`, {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: true, // Return success to prevent enumeration
        message: 'If the email exists, a password reset link has been sent.',
      },
      {
        status: 200,
        headers: {
          'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
        },
      }
    );
  }
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Validate email against admin email from environment
    const adminEmail = process.env.ADMIN_EMAIL;
    
    if (!adminEmail) {
      console.error('ADMIN_EMAIL not configured');
      // Return generic success message to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
      });
    }

    // Check if email matches admin email (case-insensitive)
    if (email.toLowerCase().trim() !== adminEmail.toLowerCase().trim()) {
      // Return generic success message to prevent email enumeration attacks
      // Don't reveal whether the email exists or not
      return NextResponse.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
      });
    }

    // Email matches - generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour from now

    // Store token (in production, store in database)
    resetTokens.set(resetToken, { token: resetToken, expiresAt });

    // In production, send email with reset link
    const resetUrl = `${request.nextUrl.origin}/reset-password-token?token=${resetToken}`;

    // TODO: Send email with reset link
    // await sendEmail({
    //   to: email,
    //   subject: 'Password Reset Request',
    //   html: `Click here to reset your password: <a href="${resetUrl}">${resetUrl}</a>`
    // });

    // In development, return the reset URL for testing
    // In production, only return generic success message
    return NextResponse.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent.',
      // Only show reset URL in development mode
      resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    // Return generic error to prevent information leakage
    return NextResponse.json({ 
      success: true,
      message: 'If the email exists, a password reset link has been sent.',
    }, { status: 200 });
  }
}

// Export token store for validation
export function getResetToken(token: string): { token: string; expiresAt: number } | undefined {
  return resetTokens.get(token);
}

export function deleteResetToken(token: string): void {
  resetTokens.delete(token);
}
