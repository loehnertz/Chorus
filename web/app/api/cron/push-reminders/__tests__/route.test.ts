/**
 * @jest-environment node
 */

jest.mock('web-push', () => ({
  __esModule: true,
  default: {
    setVapidDetails: jest.fn(),
    sendNotification: jest.fn(),
  },
}));

jest.mock('@/lib/db', () => ({
  db: {
    webPushSubscription: {
      findMany: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    schedule: {
      findMany: jest.fn(),
    },
  },
}));

import webpush from 'web-push';
import { GET } from '../route';
import { db } from '@/lib/db';

describe('GET /api/cron/push-reminders', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY = 'public';
    process.env.WEB_PUSH_VAPID_PRIVATE_KEY = 'private';
    process.env.WEB_PUSH_VAPID_SUBJECT = 'mailto:test@example.com';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('rejects unauthorized', async () => {
    const res = await GET(new Request('http://localhost:3001/api/cron/push-reminders'));
    expect(res.status).toBe(401);
  });

  it('runs when x-vercel-cron header is present', async () => {
    (db.webPushSubscription.findMany as jest.Mock).mockResolvedValue([]);
    (db.schedule.findMany as jest.Mock).mockResolvedValue([]);

    const req = new Request('http://localhost:3001/api/cron/push-reminders', {
      headers: { 'x-vercel-cron': '1' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(webpush.setVapidDetails).toHaveBeenCalled();
  });
});
