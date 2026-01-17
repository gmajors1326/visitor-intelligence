import { createHash } from 'crypto';

export function hashIP(ip: string): string {
  if (!ip || ip === 'unknown') return '';
  const salt = process.env.IP_HASH_SALT || '';
  return createHash('sha256').update(ip + salt).digest('hex').substring(0, 32);
}

export function hashUserAgent(ua: string | null): string {
  if (!ua) return '';
  const salt = process.env.UA_HASH_SALT || '';
  return createHash('sha256').update(ua + salt).digest('hex').substring(0, 32);
}
