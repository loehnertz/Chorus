/**
 * @jest-environment node
 */

jest.mock('@/lib/auth/require-approval', () => ({
  requireApprovedUserApi: jest.fn(),
  isErrorResponse: jest.fn((r: unknown) => r instanceof Response),
}));

jest.mock('@/lib/db', () => ({
  db: {
    webPushSubscription: {
      count: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

import { DELETE, GET, POST } from '../route';
import { createMockRequest, createMockSession } from '@/lib/__tests__/test-helpers';
import { requireApprovedUserApi } from '@/lib/auth/require-approval';
import { db } from '@/lib/db';

describe('GET /api/push/subscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(
      Response.json({ error: 'Unauthorized' }, { status: 401 }),
    );

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns enabled=false when no subscriptions exist', async () => {
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(createMockSession());
    (db.webPushSubscription.count as jest.Mock).mockResolvedValue(0);

    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ enabled: false, count: 0 });
  });
});

describe('POST /api/push/subscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates input', async () => {
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(createMockSession());

    const req = createMockRequest('/api/push/subscription', {
      method: 'POST',
      body: { subscription: { endpoint: 'not-a-url', keys: { p256dh: '', auth: '' } } },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it('upserts a subscription', async () => {
    const session = createMockSession({ userId: 'u1' });
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);

    (db.webPushSubscription.upsert as jest.Mock).mockResolvedValue({
      id: 's1',
      endpoint: 'https://example.com/ep',
      timezone: 'America/Los_Angeles',
      updatedAt: new Date('2026-02-08T00:00:00Z'),
    });

    const req = createMockRequest('/api/push/subscription', {
      method: 'POST',
      body: {
        subscription: {
          endpoint: 'https://example.com/ep',
          expirationTime: null,
          keys: { p256dh: 'p', auth: 'a' },
        },
        timezone: 'America/Los_Angeles',
      },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(db.webPushSubscription.upsert).toHaveBeenCalled();
  });
});

describe('DELETE /api/push/subscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes all for user when body missing', async () => {
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(createMockSession({ userId: 'u1' }));
    (db.webPushSubscription.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

    const req = createMockRequest('/api/push/subscription', { method: 'DELETE' });
    const res = await DELETE(req as never);
    expect(res.status).toBe(204);
    expect(db.webPushSubscription.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
  });

  it('deletes by endpoint', async () => {
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(createMockSession({ userId: 'u1' }));
    (db.webPushSubscription.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

    const req = createMockRequest('/api/push/subscription', {
      method: 'DELETE',
      body: { endpoint: 'https://example.com/ep' },
    });
    const res = await DELETE(req as never);
    expect(res.status).toBe(204);
    expect(db.webPushSubscription.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u1', endpoint: 'https://example.com/ep' },
    });
  });
});
