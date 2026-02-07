/**
 * @jest-environment node
 */
jest.mock('@/lib/auth/require-approval', () => ({
  requireApprovedUserApi: jest.fn(),
  isErrorResponse: jest.fn((r: unknown) => r instanceof Response),
}));

jest.mock('@/lib/suggestions', () => ({
  suggestCascadedChore: jest.fn(),
  checkCascadePace: jest.fn(),
}));

import { POST } from '../route';
import { createMockRequest, createMockSession } from '@/lib/__tests__/test-helpers';

import { requireApprovedUserApi } from '@/lib/auth/require-approval';
import { suggestCascadedChore, checkCascadePace } from '@/lib/suggestions';

describe('POST /api/schedules/suggest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(
      Response.json({ error: 'Unauthorized' }, { status: 401 }),
    );

    const request = createMockRequest('/api/schedules/suggest', {
      method: 'POST',
      body: { currentFrequency: 'DAILY' },
    });
    const response = await POST(request as never);
    expect(response.status).toBe(401);
  });

  it('should return 400 when body is invalid', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);

    const request = createMockRequest('/api/schedules/suggest', {
      method: 'POST',
      body: {},
    });
    const response = await POST(request as never);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Validation failed');
  });

  it('should return suggestion and pace warnings', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (suggestCascadedChore as jest.Mock).mockResolvedValue({
      sourceFrequency: 'WEEKLY',
      cycleStart: new Date('2026-02-02T00:00:00Z'),
      cycleEnd: new Date('2026-02-09T00:00:00Z'),
      chore: { id: 'c1', title: 'Test', description: null, frequency: 'WEEKLY' },
    });
    (checkCascadePace as jest.Mock).mockResolvedValue([{ sourceFrequency: 'YEARLY' }]);

    const request = createMockRequest('/api/schedules/suggest', {
      method: 'POST',
      body: { currentFrequency: 'DAILY', forDate: '2026-02-06T00:00:00.000Z' },
    });
    const response = await POST(request as never);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.suggestion).toBeTruthy();
    expect(body.paceWarnings).toHaveLength(1);
    expect(suggestCascadedChore).toHaveBeenCalledWith(
      expect.objectContaining({ currentFrequency: 'DAILY', now: new Date('2026-02-06T00:00:00.000Z') }),
    );
  });

  it('threads forDate through suggestion + pace computations', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (suggestCascadedChore as jest.Mock).mockResolvedValue(null);
    (checkCascadePace as jest.Mock).mockResolvedValue([]);

    const forDate = '2026-02-15';
    const request = createMockRequest('/api/schedules/suggest', {
      method: 'POST',
      body: { currentFrequency: 'DAILY', forDate },
    });
    const response = await POST(request as never);
    expect(response.status).toBe(200);

    expect(suggestCascadedChore).toHaveBeenCalledWith(
      expect.objectContaining({
        currentFrequency: 'DAILY',
        now: new Date('2026-02-15T00:00:00.000Z'),
      }),
    );
    expect(checkCascadePace).toHaveBeenCalledWith(
      expect.objectContaining({ now: new Date('2026-02-15T00:00:00.000Z') }),
    );
  });
});
