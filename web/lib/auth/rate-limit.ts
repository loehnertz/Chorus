import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

type AuthRateLimitAction = 'sign-in' | 'sign-up';

let ratelimit: Ratelimit | null = null;
let missingConfigWarned = false;

function isUpstashConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function getRatelimit(): Ratelimit | null {
  if (!isUpstashConfigured()) {
    if (process.env.NODE_ENV === 'production' && !missingConfigWarned) {
      missingConfigWarned = true;
      console.warn(
        'Auth rate limiting is disabled: missing UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN',
      );
    }
    return null;
  }
  if (ratelimit) return ratelimit;

  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    prefix: 'chorus:ratelimit',
  });
  return ratelimit;
}

export function getClientIp(request: Request): string {
  const headers = request.headers;

  // Vercel/proxies commonly provide a comma-separated list.
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() || 'unknown';

  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  return 'unknown';
}

export async function rateLimitAuthAction(
  request: Request,
  action: AuthRateLimitAction,
): Promise<Response | null> {
  const limiter = getRatelimit();
  if (!limiter) return null;

  const ip = getClientIp(request);

  try {
    const key = `auth:${action}:${ip}`;
    const result = await limiter.limit(key);

    if (result.success) return null;

    const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));

    return Response.json(
      { error: 'Too many requests. Try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSeconds),
          // Standardized ratelimit headers (draft RFC, widely supported)
          'RateLimit-Limit': String(result.limit),
          'RateLimit-Remaining': String(result.remaining),
          'RateLimit-Reset': String(Math.ceil(result.reset / 1000)),
        },
      },
    );
  } catch {
    // Fail open: auth should remain available even if Upstash is down/misconfigured.
    return null;
  }
}
