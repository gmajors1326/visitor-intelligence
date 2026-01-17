import { db } from '@/lib/db';
import { adminSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface AuthLog {
  type: 'login_success' | 'login_failure' | 'password_reset' | '2fa_success' | '2fa_failure' | 'account_locked';
  ip: string;
  userAgent?: string;
  email?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

// In-memory log store (in production, use a logging service)
const authLogs: AuthLog[] = [];
const MAX_LOG_SIZE = 1000; // Keep last 1000 logs

export function logAuthEvent(log: AuthLog): void {
  // Add to in-memory store
  authLogs.push(log);
  
  // Keep only last MAX_LOG_SIZE logs
  if (authLogs.length > MAX_LOG_SIZE) {
    authLogs.shift();
  }

  // Log to console (in production, send to logging service)
  console.log(`[AUTH] ${log.type}`, {
    ip: log.ip,
    email: log.email,
    timestamp: log.timestamp.toISOString(),
    details: log.details,
  });

  // In production, send to logging service:
  // - Sentry
  // - LogRocket
  // - Datadog
  // - CloudWatch
}

export function getAuthLogs(limit: number = 100): AuthLog[] {
  return authLogs.slice(-limit).reverse();
}

export function getAuthLogsByType(type: AuthLog['type'], limit: number = 100): AuthLog[] {
  return authLogs.filter(log => log.type === type).slice(-limit).reverse();
}

export function getFailedLoginAttempts(ip: string, windowMs: number = 15 * 60 * 1000): number {
  const cutoff = new Date(Date.now() - windowMs);
  return authLogs.filter(
    log => log.type === 'login_failure' && log.ip === ip && log.timestamp >= cutoff
  ).length;
}
