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
      delete: jest.fn(),
    },
  },
}));

import { DELETE } from '../route';
import { createMockSession } from '@/lib/__tests__/test-helpers';

import { requireApprovedUserApi } from '@/lib/auth/require-approval';
import { db } from '@/lib/db';

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeRequest() {
  return new Request('http://localhost:3001/api/schedules/test-id', { method: 'DELETE' });
}

describe('DELETE /api/schedules/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(
      Response.json({ error: 'Unauthorized' }, { status: 401 }),
    );

    const response = await DELETE(makeRequest(), makeParams('test-id'));
    expect(response.status).toBe(401);
  });

  it('should return 404 when schedule not found', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.schedule.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await DELETE(makeRequest(), makeParams('missing'));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('Schedule not found');
  });

  it('should delete schedule and return 204', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.schedule.findUnique as jest.Mock).mockResolvedValue({ id: 'test-id' });
    (db.schedule.delete as jest.Mock).mockResolvedValue({ id: 'test-id' });

    const response = await DELETE(makeRequest(), makeParams('test-id'));
    expect(response.status).toBe(204);
    expect(db.schedule.delete).toHaveBeenCalledWith({ where: { id: 'test-id' } });
  });
});
