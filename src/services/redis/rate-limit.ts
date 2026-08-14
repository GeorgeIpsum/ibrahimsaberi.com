import { redis } from "./client";

const DEFAULT_WINDOW_SECONDS = 60;
const DEFAULT_MAX_REQUESTS_PER_SECOND = 30;

interface RateLimitOptions {
  windowSeconds?: number;
  maxRequestsPerSecond?: number;
}

export async function isRateLimited(
  key: string,
  identity: string,
  {
    windowSeconds = DEFAULT_WINDOW_SECONDS,
    maxRequestsPerSecond = DEFAULT_MAX_REQUESTS_PER_SECOND,
  }: RateLimitOptions = {
    windowSeconds: DEFAULT_WINDOW_SECONDS,
    maxRequestsPerSecond: DEFAULT_MAX_REQUESTS_PER_SECOND,
  },
): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") return false;
  try {
    const rediskey = `ratelimit:${key}:${identity}`;
    const count = await redis.incr(rediskey);
    if (count === 1) await redis.expire(rediskey, windowSeconds);
    return count > maxRequestsPerSecond;
  } catch {
    return false;
  }
}
