// Account lockout after failed login attempts
// For production, use Redis or database

interface LockoutEntry {
  attempts: number;
  lockedUntil: number;
}

const lockoutStore = new Map<string, LockoutEntry>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

export function recordFailedAttempt(identifier: string): {
  locked: boolean;
  remainingAttempts: number;
  lockedUntil?: number;
} {
  const now = Date.now();
  const entry = lockoutStore.get(identifier);

  if (!entry || entry.lockedUntil < now) {
    // New entry or lockout expired
    lockoutStore.set(identifier, {
      attempts: 1,
      lockedUntil: now + ATTEMPT_WINDOW,
    });
    return {
      locked: false,
      remainingAttempts: MAX_ATTEMPTS - 1,
    };
  }

  // Entry exists
  if (entry.lockedUntil > now) {
    // Still locked
    return {
      locked: true,
      remainingAttempts: 0,
      lockedUntil: entry.lockedUntil,
    };
  }

  // Increment attempts
  entry.attempts++;
  
  if (entry.attempts >= MAX_ATTEMPTS) {
    // Lock the account
    entry.lockedUntil = now + LOCKOUT_DURATION;
    lockoutStore.set(identifier, entry);
    return {
      locked: true,
      remainingAttempts: 0,
      lockedUntil: entry.lockedUntil,
    };
  }

  lockoutStore.set(identifier, entry);
  return {
    locked: false,
    remainingAttempts: MAX_ATTEMPTS - entry.attempts,
  };
}

export function clearFailedAttempts(identifier: string): void {
  lockoutStore.delete(identifier);
}

export function isLocked(identifier: string): boolean {
  const entry = lockoutStore.get(identifier);
  if (!entry) return false;
  
  const now = Date.now();
  if (entry.lockedUntil < now) {
    lockoutStore.delete(identifier);
    return false;
  }
  
  return entry.lockedUntil > now;
}
