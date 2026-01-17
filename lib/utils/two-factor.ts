import { authenticator } from 'otplib';
import QRCode from 'qrcode';

// Configure TOTP
authenticator.options = {
  step: 30, // 30 second time steps
  window: 1, // Allow 1 time step tolerance
};

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
}

export function generateTwoFactorSecret(email: string): TwoFactorSetup {
  const secret = authenticator.generateSecret();
  const serviceName = 'Visitor Intelligence';
  const accountName = email;
  
  const otpAuthUrl = authenticator.keyuri(accountName, serviceName, secret);
  
  return {
    secret,
    qrCodeUrl: otpAuthUrl,
    manualEntryKey: secret,
  };
}

export async function generateQRCode(otpAuthUrl: string): Promise<string> {
  try {
    // Use dynamic import for server-side compatibility
    const qrcode = await import('qrcode');
    return await qrcode.default.toDataURL(otpAuthUrl);
  } catch (error) {
    console.error('QR code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
}

export function verifyTwoFactorToken(secret: string, token: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    console.error('2FA verification error:', error);
    return false;
  }
}

export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-digit backup codes
    const code = Math.floor(10000000 + Math.random() * 90000000).toString();
    codes.push(code);
  }
  return codes;
}
