import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Returns null if Upstash not configured (dev mode — skip rate limiting)
function createLimiter(requests: number, window: string): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
  })
}

export const authLimiter   = createLimiter(10, '1 m')   // 10/min
export const inviteLimiter = createLimiter(5,  '1 m')   // 5/min
export const signupLimiter = createLimiter(5,  '10 m')  // 5/10min
export const shareLimiter  = createLimiter(30, '1 m')   // 30/min

// Helper to check rate limit in route handlers
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<{ limited: boolean; reset?: number }> {
  if (!limiter) return { limited: false }
  const { success, reset } = await limiter.limit(identifier)
  if (!success) return { limited: true, reset }
  return { limited: false }
}
