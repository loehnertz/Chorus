/**
 * @jest-environment node
 */

jest.mock('@/lib/auth/require-approval', () => ({
  requireApprovedUserApi: jest.fn(),
  isErrorResponse: jest.fn((r: unknown) => r instanceof Response),
}));

jest.mock('@/lib/db', () => ({
  db: {
    schedule: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    choreCompletion: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import { DELETE } from '../route';
import { createMockRequest, createMockSession } from '@/lib/__tests__/test-helpers';
import { requireApprovedUserApi } from '@/lib/auth/require-approval';
import { db } from '@/lib/db';

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('DELETE /api/schedules/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (db.$transaction as jest.Mock).mockImplementation(async (fn: (tx: typeof db) => Promise<unknown>) => fn(db));
  });

  it('should return 401 when not authenticated', async () => {
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(
      Response.json({ error: 'Unauthorized' }, { status: 401 }),
    );

    const request = createMockRequest('/api/schedules/s1', { method: 'DELETE' });
    const response = await DELETE(request as never, makeParams('s1'));
    expect(response.status).toBe(401);
  });

  it('should return 404 when schedule not found', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.schedule.findUnique as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('/api/schedules/s1', { method: 'DELETE' });
    const response = await DELETE(request as never, makeParams('s1'));
    expect(response.status).toBe(404);
  });

  it('should hide DAILY schedules instead of deleting', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.schedule.findUnique as jest.Mock).mockResolvedValue({
      id: 's1',
      slotType: 'DAILY',
      chore: { frequency: 'DAILY' },
    });

    const request = createMockRequest('/api/schedules/s1', { method: 'DELETE' });
    const response = await DELETE(request as never, makeParams('s1'));
    expect(response.status).toBe(204);

    expect(db.choreCompletion.deleteMany).toHaveBeenCalledWith({ where: { scheduleId: 's1' } });
    expect(db.schedule.update).toHaveBeenCalledWith({ where: { id: 's1' }, data: { hidden: true } });
    expect(db.schedule.delete).not.toHaveBeenCalled();
  });

  it('should hide pinned WEEKLY schedules (auto-planned) instead of deleting', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.schedule.findUnique as jest.Mock).mockResolvedValue({
      id: 's3',
      slotType: 'DAILY',
      scheduledFor: new Date('2026-02-09T00:00:00Z'), // Monday
      chore: { frequency: 'WEEKLY', weeklyAutoPlanDay: 0 }, // Monday (Mon=0)
    });

    const request = createMockRequest('/api/schedules/s3', { method: 'DELETE' });
    const response = await DELETE(request as never, makeParams('s3'));
    expect(response.status).toBe(204);

    expect(db.choreCompletion.deleteMany).toHaveBeenCalledWith({ where: { scheduleId: 's3' } });
    expect(db.schedule.update).toHaveBeenCalledWith({ where: { id: 's3' }, data: { hidden: true } });
    expect(db.schedule.delete).not.toHaveBeenCalled();
  });

  it('should hide pinned BIWEEKLY schedules (auto-planned) instead of deleting', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.schedule.findUnique as jest.Mock).mockResolvedValue({
      id: 's4',
      slotType: 'DAILY',
      scheduledFor: new Date('2026-02-22T00:00:00Z'), // Sunday
      chore: {
        frequency: 'BIWEEKLY',
        biweeklyAutoPlanDay: 6, // Sunday (Mon=0..Sun=6)
        biweeklyAutoPlanAnchor: new Date('2026-02-08T00:00:00Z'),
      },
    });

    const request = createMockRequest('/api/schedules/s4', { method: 'DELETE' });
    const response = await DELETE(request as never, makeParams('s4'));
    expect(response.status).toBe(204);

    expect(db.choreCompletion.deleteMany).toHaveBeenCalledWith({ where: { scheduleId: 's4' } });
    expect(db.schedule.update).toHaveBeenCalledWith({ where: { id: 's4' }, data: { hidden: true } });
    expect(db.schedule.delete).not.toHaveBeenCalled();
  });

  it('should delete non-DAILY schedules and their completions', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.schedule.findUnique as jest.Mock).mockResolvedValue({
      id: 's2',
      slotType: 'WEEKLY',
      chore: { frequency: 'WEEKLY' },
    });

    const request = createMockRequest('/api/schedules/s2', { method: 'DELETE' });
    const response = await DELETE(request as never, makeParams('s2'));
    expect(response.status).toBe(204);

    expect(db.choreCompletion.deleteMany).toHaveBeenCalledWith({ where: { scheduleId: 's2' } });
    expect(db.schedule.delete).toHaveBeenCalledWith({ where: { id: 's2' } });
  });
});
