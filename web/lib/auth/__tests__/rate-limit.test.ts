/**
 * @jest-environment node
 */

const limitMock = jest.fn();

jest.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: jest.fn(() => ({})),
  },
}));

jest.mock('@upstash/ratelimit', () => {
  const Ratelimit = jest.fn().mockImplementation(() => ({
    limit: limitMock,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(Ratelimit as any).slidingWindow = jest.fn(() => ({}));

  return { Ratelimit };
});

describe('auth rate limiting', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getClientIp', () => {
    it('prefers x-forwarded-for (first value)', async () => {
      const { getClientIp } = await import('../rate-limit');

      const req = new Request('http://localhost/api/auth/sign-in', {
        headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
      });

      expect(getClientIp(req)).toBe('1.2.3.4');
    });

    it('falls back to x-real-ip', async () => {
      const { getClientIp } = await import('../rate-limit');

      const req = new Request('http://localhost/api/auth/sign-in', {
        headers: { 'x-real-ip': '9.9.9.9' },
      });

      expect(getClientIp(req)).toBe('9.9.9.9');
    });
  });

  describe('rateLimitAuthAction', () => {
    it('returns null when Upstash env is not configured', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      const { rateLimitAuthAction } = await import('../rate-limit');
      const req = new Request('http://localhost/api/auth/sign-in');

      await expect(rateLimitAuthAction(req, 'sign-in')).resolves.toBeNull();
      expect(limitMock).not.toHaveBeenCalled();
    });

    it('returns 429 when limiter blocks', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://example.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';

      limitMock.mockResolvedValue({
        success: false,
        limit: 5,
        remaining: 0,
        reset: Date.now() + 60_000,
      });

      const { rateLimitAuthAction } = await import('../rate-limit');
      const req = new Request('http://localhost/api/auth/sign-in', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });

      const res = await rateLimitAuthAction(req, 'sign-in');
      expect(res).toBeInstanceOf(Response);
      expect(res?.status).toBe(429);
      expect(res?.headers.get('Retry-After')).toBeTruthy();
    });

    it('returns null when limiter allows', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://example.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';

      limitMock.mockResolvedValue({
        success: true,
        limit: 5,
        remaining: 4,
        reset: Date.now() + 60_000,
      });

      const { rateLimitAuthAction } = await import('../rate-limit');
      const req = new Request('http://localhost/api/auth/sign-in', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });

      await expect(rateLimitAuthAction(req, 'sign-in')).resolves.toBeNull();
    });
  });
});
