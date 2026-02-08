jest.mock('@/lib/db', () => ({
  db: {
    chore: {
      findMany: jest.fn(),
    },
    schedule: {
      findMany: jest.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import {
  getDashboardPlanningWarnings,
  getRemainingFractionUtc,
  shouldShowPlanningWarning,
} from '@/lib/dashboard-planning-warnings'

describe('dashboard planning warnings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('computes remaining fraction for a fixed range', () => {
    const range = {
      start: new Date('2026-02-01T00:00:00Z'),
      end: new Date('2026-02-11T00:00:00Z'),
    }
    const now = new Date('2026-02-09T00:00:00Z')

    expect(getRemainingFractionUtc(range, now)).toBeCloseTo(0.2, 5)
  })

  it('shows warning when remaining is at or below threshold', () => {
    const range = {
      start: new Date('2026-02-01T00:00:00Z'),
      end: new Date('2026-02-11T00:00:00Z'),
    }
    const now = new Date('2026-02-09T00:00:00Z')

    expect(shouldShowPlanningWarning({ range, now, remainingThreshold: 0.25 })).toBe(true)
    expect(shouldShowPlanningWarning({ range, now, remainingThreshold: 0.19 })).toBe(false)
  })

  it('returns unscheduled chores for late cycles (household-wide)', async () => {
    ;(db.chore.findMany as jest.Mock).mockResolvedValue([
      { id: 'w1', title: 'Take out trash', frequency: 'WEEKLY' },
      { id: 'w2', title: 'Vacuum', frequency: 'WEEKLY' },
    ])

    ;(db.schedule.findMany as jest.Mock).mockImplementation(async (args: unknown) => {
      const frequency = (args as { where?: { chore?: { frequency?: string } } })?.where?.chore?.frequency
      if (frequency === 'WEEKLY') {
        return [{ choreId: 'w1' }]
      }
      return []
    })

    const warnings = await getDashboardPlanningWarnings(new Date('2026-02-08T12:00:00Z'), {
      remainingThreshold: 1,
    })

    expect(warnings).toHaveLength(1)
    expect(warnings[0].frequency).toBe('WEEKLY')
    expect(warnings[0].unscheduledChores.map((c) => c.id)).toEqual(['w2'])
  })

  it('queries schedules with hidden=false so hidden items do not count', async () => {
    ;(db.chore.findMany as jest.Mock).mockResolvedValue([
      { id: 'w1', title: 'Take out trash', frequency: 'WEEKLY' },
    ])
    ;(db.schedule.findMany as jest.Mock).mockResolvedValue([])

    await getDashboardPlanningWarnings(new Date('2026-02-08T12:00:00Z'), { remainingThreshold: 1 })

    expect(db.schedule.findMany).toHaveBeenCalled()
    const call = (db.schedule.findMany as jest.Mock).mock.calls[0][0]
    expect(call.where.hidden).toBe(false)
  })
})
