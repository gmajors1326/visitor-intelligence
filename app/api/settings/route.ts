import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await db.select().from(adminSettings).limit(1);
    const config = settings[0];

    return NextResponse.json({
      twoFactorEnabled: config?.twoFactorEnabled || false,
      sessionTimeout: config?.sessionTimeout || 60 * 60 * 24 * 7,
      allowedIPs: (config?.allowedIPs as string[]) || [],
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { sessionTimeout, allowedIPs } = await request.json();

    const settings = await db.select().from(adminSettings).limit(1);
    const config = settings[0];

    if (config) {
      await db
        .update(adminSettings)
        .set({
          sessionTimeout,
          allowedIPs: allowedIPs as any,
          updatedAt: new Date(),
        })
        .where(eq(adminSettings.id, config.id));
    } else {
      await db.insert(adminSettings).values({
        sessionTimeout,
        allowedIPs: allowedIPs as any,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
