// Redis-based rate limiting using Upstash
// Falls back to in-memory if Redis is not configured

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { checkRateLimit as checkRateLimitMemory, getClientIdentifier as getClientIdentifierMemory } from './rate-limit';

let redisClient: Redis | null = null;
let rateLimiters: Map<string, Ratelimit> = new Map();

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    try {
      redisClient = new Redis({
        url: upstashUrl,
        token: upstashToken,
      });
      return redisClient;
    } catch (error) {
      console.error('Failed to initialize Redis client:', error);
      return null;
    }
  }

  return null;
}

function getRateLimiter(identifier: string, windowMs: number, maxRequests: number): Ratelimit | null {
  const cacheKey = `${identifier}:${windowMs}:${maxRequests}`;
  
  if (rateLimiters.has(cacheKey)) {
    return rateLimiters.get(cacheKey)!;
  }

  const client = getRedisClient();
  if (!client) return null;

  const ratelimit = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs} ms`),
    analytics: true,
  });

  rateLimiters.set(cacheKey, ratelimit);
  return ratelimit;
}

export async function checkRateLimitRedis(
  identifier: string,
  options: { windowMs: number; maxRequests: number }
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const limiter = getRateLimiter(identifier, options.windowMs, options.maxRequests);

  if (!limiter) {
    // Fallback to in-memory rate limiting
    return checkRateLimitMemory(identifier, options);
  }

  try {
    const result = await limiter.limit(identifier);
    
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetTime: result.reset,
    };
  } catch (error) {
    console.error('Redis rate limit error:', error);
    // Fallback to in-memory on error
    return checkRateLimitMemory(identifier, options);
  }
}

export function getClientIdentifier(request: Request): string {
  // Use IP address for rate limiting
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return ip;
}
