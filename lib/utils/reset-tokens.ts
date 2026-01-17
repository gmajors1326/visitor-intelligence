// Reset token storage and management
// In production, use Redis or database

interface ResetToken {
  token: string;
  expiresAt: number;
}

const resetTokens = new Map<string, ResetToken>();

export function getResetToken(token: string): ResetToken | undefined {
  return resetTokens.get(token);
}

export function setResetToken(token: string, expiresAt: number): void {
  resetTokens.set(token, { token, expiresAt });
}

export function deleteResetToken(token: string): void {
  resetTokens.delete(token);
}

// Clean up expired tokens periodically
export function cleanupExpiredTokens(): void {
  const now = Date.now();
  for (const [token, data] of resetTokens.entries()) {
    if (data.expiresAt < now) {
      resetTokens.delete(token);
    }
  }
}

// Run cleanup every 5 minutes (only in Node.js environment, not in serverless)
// In serverless environments, cleanup happens on-demand
if (typeof process !== 'undefined' && process.env && !process.env.VERCEL) {
  if (typeof setInterval !== 'undefined') {
    setInterval(cleanupExpiredTokens, 5 * 60 * 1000);
  }
}
