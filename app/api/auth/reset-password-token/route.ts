import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { getResetToken, deleteResetToken } from '../forgot-password/route';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
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

    // Generate new password hash
    const newHash = await hash(newPassword, 10);

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
