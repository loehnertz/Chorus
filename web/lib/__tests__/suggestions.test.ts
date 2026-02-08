jest.mock('@prisma/client', () => ({
  Frequency: {
    DAILY: 'DAILY',
    WEEKLY: 'WEEKLY',
    BIWEEKLY: 'BIWEEKLY',
    MONTHLY: 'MONTHLY',
    BIMONTHLY: 'BIMONTHLY',
    SEMIANNUAL: 'SEMIANNUAL',
    YEARLY: 'YEARLY',
  },
}));

jest.mock('@/lib/db', () => ({
  db: {
    chore: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    choreCompletion: {
      groupBy: jest.fn(),
    },
    schedule: {
      findMany: jest.fn(),
    },
  },
}));

import { db } from '@/lib/db';
import { checkCascadePace, getCascadeSourceFrequency, suggestCascadedChore } from '../suggestions';

describe('getCascadeSourceFrequency', () => {
  it('should map current frequency to source frequency', () => {
    expect(getCascadeSourceFrequency('DAILY')).toBe('WEEKLY');
    expect(getCascadeSourceFrequency('WEEKLY')).toBe('BIWEEKLY');
    expect(getCascadeSourceFrequency('BIWEEKLY')).toBe('MONTHLY');
    expect(getCascadeSourceFrequency('MONTHLY')).toBe('BIMONTHLY');
    expect(getCascadeSourceFrequency('BIMONTHLY')).toBe('SEMIANNUAL');
    expect(getCascadeSourceFrequency('SEMIANNUAL')).toBe('YEARLY');
    expect(getCascadeSourceFrequency('YEARLY')).toBeNull();
  });
});

describe('suggestCascadedChore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null for YEARLY (no higher level)', async () => {
    const res = await suggestCascadedChore({ currentFrequency: 'YEARLY', now: new Date('2026-01-01T00:00:00Z') });
    expect(res).toBeNull();
  });

  it('should exclude chores already scheduled in the current cycle', async () => {
    (db.schedule.findMany as jest.Mock).mockResolvedValue([{ choreId: 'weekly-1' }]);

    (db.chore.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'weekly-2',
        title: 'B',
        description: null,
        frequency: 'WEEKLY',
      },
      {
        id: 'weekly-3',
        title: 'C',
        description: null,
        frequency: 'WEEKLY',
      },
    ]);

    ;(db.choreCompletion.groupBy as jest.Mock).mockResolvedValue([])

    const res = await suggestCascadedChore({
      currentFrequency: 'DAILY',
      now: new Date('2026-02-04T10:00:00Z'),
    });

    expect(db.schedule.findMany).toHaveBeenCalled();
    expect(db.chore.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          frequency: 'WEEKLY',
          id: { notIn: ['weekly-1'] },
        }),
        select: expect.any(Object),
      }),
    );

    expect(res?.chore.id).toBe('weekly-2');
  });

  it('should prioritize never-completed chores', async () => {
    (db.schedule.findMany as jest.Mock).mockResolvedValue([]);
    (db.chore.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'biweekly-1',
        title: 'Already done',
        description: null,
        frequency: 'BIWEEKLY',
      },
      {
        id: 'biweekly-2',
        title: 'Never done',
        description: null,
        frequency: 'BIWEEKLY',
      },
    ]);

    ;(db.choreCompletion.groupBy as jest.Mock).mockResolvedValue([
      {
        choreId: 'biweekly-1',
        _max: { completedAt: new Date('2026-01-01T00:00:00Z') },
      },
    ])

    const res = await suggestCascadedChore({
      currentFrequency: 'WEEKLY',
      now: new Date('2026-02-01T00:00:00Z'),
    });

    expect(res?.chore.id).toBe('biweekly-2');
  });

  it('should prioritize least-recently completed chores among completed', async () => {
    (db.schedule.findMany as jest.Mock).mockResolvedValue([]);
    (db.chore.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'bimonthly-1',
        title: 'More recent',
        description: null,
        frequency: 'BIMONTHLY',
      },
      {
        id: 'bimonthly-2',
        title: 'Older',
        description: null,
        frequency: 'BIMONTHLY',
      },
    ]);

    ;(db.choreCompletion.groupBy as jest.Mock).mockResolvedValue([
      {
        choreId: 'bimonthly-1',
        _max: { completedAt: new Date('2026-01-10T00:00:00Z') },
      },
      {
        choreId: 'bimonthly-2',
        _max: { completedAt: new Date('2025-01-10T00:00:00Z') },
      },
    ])

    const res = await suggestCascadedChore({
      currentFrequency: 'MONTHLY',
      now: new Date('2026-02-01T00:00:00Z'),
    });

    expect(res?.chore.id).toBe('bimonthly-2');
  });

  it('should prefer assigned chores when userId is provided and eligible assigned chores exist', async () => {
    (db.schedule.findMany as jest.Mock).mockResolvedValue([]);
    // First query is the assigned-only candidate set.
    (db.chore.findMany as jest.Mock).mockResolvedValueOnce([
      {
        id: 'weekly-2',
        title: 'Assigned',
        description: null,
        frequency: 'WEEKLY',
      },
    ])

    ;(db.choreCompletion.groupBy as jest.Mock).mockResolvedValue([])

    const res = await suggestCascadedChore({
      currentFrequency: 'DAILY',
      userId: 'user-1',
      now: new Date('2026-02-04T10:00:00Z'),
    });

    expect(res?.chore.id).toBe('weekly-2');
  });
});

describe('checkCascadePace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should warn when remaining chores exceed remaining slots', async () => {
    (db.chore.count as jest.Mock).mockImplementation(async ({ where }: { where: { frequency: string } }) => {
      if (where.frequency === 'YEARLY') return 3;
      return 0;
    });

    (db.schedule.findMany as jest.Mock).mockResolvedValue([]);

    const warnings = await checkCascadePace({ now: new Date('2026-12-10T00:00:00Z') });

    expect(warnings.some((w) => w.sourceFrequency === 'YEARLY')).toBe(true);
    const yearly = warnings.find((w) => w.sourceFrequency === 'YEARLY');
    expect(yearly?.remainingChores).toBe(3);
    expect(yearly?.remainingSlots).toBe(1);
  });

  it('uses calendar-week slots for MONTHLY pace warnings', async () => {
    (db.chore.count as jest.Mock).mockImplementation(async ({ where }: { where: { frequency: string } }) => {
      if (where.frequency === 'MONTHLY') return 99;
      return 0;
    });

    (db.schedule.findMany as jest.Mock).mockResolvedValue([]);

    const warnings = await checkCascadePace({ now: new Date('2026-08-01T00:00:00Z') });

    const monthly = warnings.find((w) => w.sourceFrequency === 'MONTHLY');
    expect(monthly).toBeTruthy();
    expect(monthly?.remainingSlots).toBe(6);
  });
});
