import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { secret, backupCodes } = await request.json();

    const settings = await db.select().from(adminSettings).limit(1);
    const config = settings[0];

    if (config) {
      await db
        .update(adminSettings)
        .set({
          twoFactorSecret: secret,
          backupCodes: backupCodes as any,
          updatedAt: new Date(),
        })
        .where(eq(adminSettings.id, config.id));
    } else {
      await db.insert(adminSettings).values({
        twoFactorSecret: secret,
        backupCodes: backupCodes as any,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving 2FA setup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
