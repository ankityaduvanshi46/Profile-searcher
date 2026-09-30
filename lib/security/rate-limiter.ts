import { kv } from "../storage/kv";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

export async function checkRateLimit(
  keyPrefix: string,
  identifier: string,
  limit: number,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const key = `ratelimit:${keyPrefix}:${identifier}`;
  const count = await kv.incr(key);

  if (count === 1) {
    await kv.expire(key, windowSeconds);
  }

  const allowed = count <= limit;
  const remaining = Math.max(0, limit - count);

  return {
    allowed,
    limit,
    remaining,
    resetSeconds: windowSeconds
  };
}
