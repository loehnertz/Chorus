/**
 * @jest-environment node
 */

jest.mock('@neondatabase/auth/next/server', () => {
  const handlerPostMock = jest.fn();
  return {
    authApiHandler: () => ({
      GET: jest.fn(),
      POST: handlerPostMock,
    }),
    __handlerPostMock: handlerPostMock,
  };
});

jest.mock('@/lib/auth/rate-limit', () => ({
  rateLimitAuthAction: jest.fn(),
}));

import { POST } from '../route';
import { rateLimitAuthAction } from '@/lib/auth/rate-limit';
import { createMockRequest } from '@/lib/__tests__/test-helpers';

const { __handlerPostMock } = jest.requireMock('@neondatabase/auth/next/server') as {
  __handlerPostMock: jest.Mock;
};

describe('POST /api/auth/*', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.CHORUS_SIGN_UP_ENABLED;
    __handlerPostMock.mockResolvedValue(Response.json({ ok: true }, { status: 200 }));
    ;(rateLimitAuthAction as jest.Mock).mockResolvedValue(null);
  });

  it('blocks sign-up requests when disabled', async () => {
    const request = createMockRequest('/api/auth/sign-up/email', { method: 'POST' });
    const response = await POST(request as never, {
      params: Promise.resolve({ path: ['sign-up', 'email'] }),
    });

    expect(response.status).toBe(403);
    expect(__handlerPostMock).not.toHaveBeenCalled();
    expect(rateLimitAuthAction).not.toHaveBeenCalled();
  });

  it('passes through sign-up requests when enabled', async () => {
    process.env.CHORUS_SIGN_UP_ENABLED = '1';

    const request = createMockRequest('/api/auth/sign-up/email', { method: 'POST' });
    const response = await POST(request as never, {
      params: Promise.resolve({ path: ['sign-up', 'email'] }),
    });

    expect(response.status).toBe(200);
    expect(rateLimitAuthAction).toHaveBeenCalledWith(expect.any(Request), 'sign-up');
    expect(__handlerPostMock).toHaveBeenCalledTimes(1);
  });

  it('rate-limits sign-up requests when limiter responds', async () => {
    process.env.CHORUS_SIGN_UP_ENABLED = '1';
    ;(rateLimitAuthAction as jest.Mock).mockResolvedValue(
      Response.json({ error: 'Too many requests. Try again later.' }, { status: 429 }),
    );

    const request = createMockRequest('/api/auth/sign-up/email', { method: 'POST' });
    const response = await POST(request as never, {
      params: Promise.resolve({ path: ['sign-up', 'email'] }),
    });

    expect(response.status).toBe(429);
    expect(rateLimitAuthAction).toHaveBeenCalledWith(expect.any(Request), 'sign-up');
    expect(__handlerPostMock).not.toHaveBeenCalled();
  });

  it('rate-limits sign-in requests when limiter responds', async () => {
    ;(rateLimitAuthAction as jest.Mock).mockResolvedValue(
      Response.json({ error: 'Too many requests. Try again later.' }, { status: 429 }),
    );

    const request = createMockRequest('/api/auth/sign-in', { method: 'POST' });
    const response = await POST(request as never, {
      params: Promise.resolve({ path: ['sign-in'] }),
    });

    expect(response.status).toBe(429);
    expect(rateLimitAuthAction).toHaveBeenCalledWith(expect.any(Request), 'sign-in');
    expect(__handlerPostMock).not.toHaveBeenCalled();
  });

  it('passes through to Neon Auth handler when not limited', async () => {
    const request = createMockRequest('/api/auth/sign-in', { method: 'POST' });
    const response = await POST(request as never, {
      params: Promise.resolve({ path: ['sign-in'] }),
    });

    expect(response.status).toBe(200);
    expect(__handlerPostMock).toHaveBeenCalledTimes(1);
  });
});
