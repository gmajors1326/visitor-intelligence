import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// In-memory store for reset tokens (in production, use Redis or database)
const resetTokens = new Map<string, { token: string; expiresAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour from now

    // Store token (in production, store in database)
    resetTokens.set(resetToken, { token: resetToken, expiresAt });

    // In production, send email with reset link
    // For now, return the reset link in the response (you should remove this in production)
    const resetUrl = `${request.nextUrl.origin}/reset-password-token?token=${resetToken}`;

    // TODO: Send email with reset link
    // await sendEmail({
    //   to: email,
    //   subject: 'Password Reset Request',
    //   html: `Click here to reset your password: <a href="${resetUrl}">${resetUrl}</a>`
    // });

    return NextResponse.json({
      success: true,
      message: 'Password reset link has been sent to your email.',
      // Remove this in production - only for development/testing
      resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

// Export token store for validation
export function getResetToken(token: string): { token: string; expiresAt: number } | undefined {
  return resetTokens.get(token);
}

export function deleteResetToken(token: string): void {
  resetTokens.delete(token);
}
