import { NextRequest, NextResponse } from 'next/server';
import { compare, hash } from 'bcryptjs';

// Dynamic route to prevent static optimization
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authCookie = request.cookies.get('admin_auth');
    if (!authCookie || authCookie.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminPasswordHash) {
      return NextResponse.json(
        { error: 'Admin password not configured' },
        { status: 500 }
      );
    }

    // Verify current password
    let isValid = false;
    if (adminPasswordHash.startsWith('dev:')) {
      const devPassword = adminPasswordHash.substring(4);
      isValid = currentPassword === devPassword;
    } else {
      isValid = await compare(currentPassword, adminPasswordHash);
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    // Generate new password hash
    const newHash = await hash(newPassword, 10);

    // Return the new hash - user needs to update it in Vercel
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
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
