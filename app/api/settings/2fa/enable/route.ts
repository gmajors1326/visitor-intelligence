import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const settings = await db.select().from(adminSettings).limit(1);
    const config = settings[0];

    if (!config || !config.twoFactorSecret) {
      return NextResponse.json({ error: '2FA not set up' }, { status: 400 });
    }

    await db
      .update(adminSettings)
      .set({
        twoFactorEnabled: true,
        updatedAt: new Date(),
      })
      .where(eq(adminSettings.id, config.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error enabling 2FA:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
