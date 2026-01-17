import { NextResponse } from 'next/server';
import { generateTwoFactorSecret, generateQRCode, generateBackupCodes } from '@/lib/utils/two-factor';
import { db } from '@/lib/db';
import { adminSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'gmajors1326@gmail.com.com';
    const setup = generateTwoFactorSecret(adminEmail);
    const qrCode = await generateQRCode(setup.qrCodeUrl);
    const backupCodes = generateBackupCodes();

    // Save to database
    const settings = await db.select().from(adminSettings).limit(1);
    const config = settings[0];

    if (config) {
      await db
        .update(adminSettings)
        .set({
          twoFactorSecret: setup.secret,
          backupCodes: backupCodes as any,
          updatedAt: new Date(),
        })
        .where(eq(adminSettings.id, config.id));
    } else {
      await db.insert(adminSettings).values({
        twoFactorSecret: setup.secret,
        backupCodes: backupCodes as any,
      });
    }

    return NextResponse.json({
      secret: setup.secret,
      qrCodeUrl: qrCode,
      backupCodes,
      manualEntryKey: setup.manualEntryKey,
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
