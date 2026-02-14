jest.mock('@/lib/db', () => ({
  db: {
    chore: {
      findMany: jest.fn(),
    },
    schedule: {
      createMany: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import {
  ensureBiweeklyPinnedSchedules,
  ensureDailySchedules,
  ensureWeeklyPinnedSchedules,
  rollForwardUnfinishedSchedulesToToday,
} from '../auto-schedule'

describe('ensureDailySchedules', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(db.schedule.count as jest.Mock).mockResolvedValue(0)
  })

  it('should create schedules for all daily chores for today', async () => {
    ;(db.chore.findMany as jest.Mock).mockResolvedValue([
      { id: 'chore-1' },
      { id: 'chore-2' },
      { id: 'chore-3' },
    ])
    ;(db.schedule.createMany as jest.Mock).mockResolvedValue({ count: 3 })

    const result = await ensureDailySchedules(new Date('2026-02-07T14:30:00Z'))

    expect(result).toEqual({ created: 3 })

    expect(db.chore.findMany).toHaveBeenCalledWith({
      where: { frequency: 'DAILY' },
      select: { id: true },
    })

    expect(db.schedule.createMany).toHaveBeenCalledWith({
      data: [
        { choreId: 'chore-1', scheduledFor: new Date('2026-02-07T00:00:00Z'), slotType: 'DAILY', suggested: false },
        { choreId: 'chore-2', scheduledFor: new Date('2026-02-07T00:00:00Z'), slotType: 'DAILY', suggested: false },
        { choreId: 'chore-3', scheduledFor: new Date('2026-02-07T00:00:00Z'), slotType: 'DAILY', suggested: false },
      ],
      skipDuplicates: true,
    })
  })

  it('should skip createMany when all schedules already exist', async () => {
    ;(db.chore.findMany as jest.Mock).mockResolvedValue([{ id: 'chore-1' }, { id: 'chore-2' }])
    ;(db.schedule.count as jest.Mock).mockResolvedValue(2)

    const result = await ensureDailySchedules(new Date('2026-02-07T14:30:00Z'))

    expect(result).toEqual({ created: 0 })
    expect(db.schedule.createMany).not.toHaveBeenCalled()
  })

  it('should return count less than total when some schedules already exist', async () => {
    ;(db.chore.findMany as jest.Mock).mockResolvedValue([
      { id: 'chore-1' },
      { id: 'chore-2' },
    ])
    ;(db.schedule.createMany as jest.Mock).mockResolvedValue({ count: 1 })

    const result = await ensureDailySchedules(new Date('2026-02-07T10:00:00Z'))

    expect(result).toEqual({ created: 1 })
    expect(db.schedule.createMany).toHaveBeenCalled()
  })

  it('should return zero and skip createMany when no daily chores exist', async () => {
    ;(db.chore.findMany as jest.Mock).mockResolvedValue([])

    const result = await ensureDailySchedules(new Date('2026-02-07T10:00:00Z'))

    expect(result).toEqual({ created: 0 })
    expect(db.schedule.createMany).not.toHaveBeenCalled()
  })

  it('should use start-of-day UTC regardless of input time', async () => {
    ;(db.chore.findMany as jest.Mock).mockResolvedValue([{ id: 'chore-1' }])
    ;(db.schedule.createMany as jest.Mock).mockResolvedValue({ count: 1 })

    await ensureDailySchedules(new Date('2026-02-07T23:59:59Z'))

    const data = (db.schedule.createMany as jest.Mock).mock.calls[0][0].data
    expect(data[0].scheduledFor).toEqual(new Date('2026-02-07T00:00:00Z'))
  })

  it('should set suggested to false and slotType to DAILY', async () => {
    ;(db.chore.findMany as jest.Mock).mockResolvedValue([{ id: 'chore-1' }])
    ;(db.schedule.createMany as jest.Mock).mockResolvedValue({ count: 1 })

    await ensureDailySchedules(new Date('2026-02-07T12:00:00Z'))

    const data = (db.schedule.createMany as jest.Mock).mock.calls[0][0].data
    expect(data[0].suggested).toBe(false)
    expect(data[0].slotType).toBe('DAILY')
  })

  it('should create schedules for multiple days when through is provided', async () => {
    ;(db.chore.findMany as jest.Mock).mockResolvedValue([{ id: 'chore-1' }])
    ;(db.schedule.createMany as jest.Mock).mockResolvedValue({ count: 3 })

    const result = await ensureDailySchedules(
      new Date('2026-02-07T10:00:00Z'),
      new Date('2026-02-10T00:00:00Z'),
    )

    expect(result).toEqual({ created: 3 })

    const data = (db.schedule.createMany as jest.Mock).mock.calls[0][0].data
    expect(data).toHaveLength(3)
    expect(data.map((d: { scheduledFor: Date }) => d.scheduledFor)).toEqual([
      new Date('2026-02-07T00:00:00Z'),
      new Date('2026-02-08T00:00:00Z'),
      new Date('2026-02-09T00:00:00Z'),
    ])
  })

  it('should clamp schedule generation to 90 days', async () => {
    ;(db.chore.findMany as jest.Mock).mockResolvedValue([{ id: 'chore-1' }])
    ;(db.schedule.createMany as jest.Mock).mockResolvedValue({ count: 90 })

    await ensureDailySchedules(
      new Date('2026-02-07T10:00:00Z'),
      new Date('2027-02-07T00:00:00Z'),
    )

    const data = (db.schedule.createMany as jest.Mock).mock.calls[0][0].data
    expect(data).toHaveLength(90)
    expect(data[0].scheduledFor).toEqual(new Date('2026-02-07T00:00:00Z'))
    expect(data[data.length - 1].scheduledFor).toEqual(new Date('2026-05-07T00:00:00Z'))
  })

  it('should create cross-product of days and chores for a date range', async () => {
    ;(db.chore.findMany as jest.Mock).mockResolvedValue([
      { id: 'chore-1' },
      { id: 'chore-2' },
    ])
    ;(db.schedule.createMany as jest.Mock).mockResolvedValue({ count: 4 })

    await ensureDailySchedules(
      new Date('2026-02-07T00:00:00Z'),
      new Date('2026-02-09T00:00:00Z'),
    )

    const data = (db.schedule.createMany as jest.Mock).mock.calls[0][0].data
    expect(data).toHaveLength(4)
    expect(data).toEqual([
      { choreId: 'chore-1', scheduledFor: new Date('2026-02-07T00:00:00Z'), slotType: 'DAILY', suggested: false },
      { choreId: 'chore-2', scheduledFor: new Date('2026-02-07T00:00:00Z'), slotType: 'DAILY', suggested: false },
      { choreId: 'chore-1', scheduledFor: new Date('2026-02-08T00:00:00Z'), slotType: 'DAILY', suggested: false },
      { choreId: 'chore-2', scheduledFor: new Date('2026-02-08T00:00:00Z'), slotType: 'DAILY', suggested: false },
    ])
  })

  it('should treat through as exclusive (not include that day)', async () => {
    ;(db.chore.findMany as jest.Mock).mockResolvedValue([{ id: 'chore-1' }])
    ;(db.schedule.createMany as jest.Mock).mockResolvedValue({ count: 1 })

    await ensureDailySchedules(
      new Date('2026-02-07T00:00:00Z'),
      new Date('2026-02-08T00:00:00Z'),
    )

    const data = (db.schedule.createMany as jest.Mock).mock.calls[0][0].data
    expect(data).toHaveLength(1)
    expect(data[0].scheduledFor).toEqual(new Date('2026-02-07T00:00:00Z'))
  })
})

describe('ensureWeeklyPinnedSchedules', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(db.schedule.count as jest.Mock).mockResolvedValue(0)
  })

  it('should return zero and skip createMany when no weekly pinned chores exist', async () => {
    ;(db.chore.findMany as jest.Mock).mockResolvedValue([])

    const result = await ensureWeeklyPinnedSchedules(new Date('2026-02-07T10:00:00Z'))

    expect(result).toEqual({ created: 0 })
    expect(db.schedule.createMany).not.toHaveBeenCalled()
  })

  it('should create schedules only on the configured weekday within a date range', async () => {
    // 2026-02-07 is a Saturday. The first Monday in this range is 2026-02-09.
    ;(db.chore.findMany as jest.Mock).mockResolvedValue([
      { id: 'weekly-1', weeklyAutoPlanDay: 0 },
      { id: 'weekly-2', weeklyAutoPlanDay: 0 },
    ])
    ;(db.schedule.createMany as jest.Mock).mockResolvedValue({ count: 2 })

    const result = await ensureWeeklyPinnedSchedules(
      new Date('2026-02-07T10:00:00Z'),
      new Date('2026-02-16T00:00:00Z')
    )

    expect(result).toEqual({ created: 2 })

    expect(db.schedule.createMany).toHaveBeenCalledWith({
      data: [
        { choreId: 'weekly-1', scheduledFor: new Date('2026-02-09T00:00:00Z'), slotType: 'DAILY', suggested: false },
        { choreId: 'weekly-2', scheduledFor: new Date('2026-02-09T00:00:00Z'), slotType: 'DAILY', suggested: false },
      ],
      skipDuplicates: true,
    })
  })

  it('should skip createMany when all weekly pinned schedules already exist', async () => {
    ;(db.chore.findMany as jest.Mock).mockResolvedValue([
      { id: 'weekly-1', weeklyAutoPlanDay: 0 },
      { id: 'weekly-2', weeklyAutoPlanDay: 0 },
    ])
    ;(db.schedule.count as jest.Mock).mockResolvedValue(2)

    const result = await ensureWeeklyPinnedSchedules(
      new Date('2026-02-07T10:00:00Z'),
      new Date('2026-02-16T00:00:00Z')
    )

    expect(result).toEqual({ created: 0 })
    expect(db.schedule.createMany).not.toHaveBeenCalled()
  })

  it('should use start-of-day UTC for scheduledFor', async () => {
    ;(db.chore.findMany as jest.Mock).mockResolvedValue([{ id: 'weekly-1', weeklyAutoPlanDay: 0 }])
    ;(db.schedule.createMany as jest.Mock).mockResolvedValue({ count: 1 })

    await ensureWeeklyPinnedSchedules(
      new Date('2026-02-09T23:59:59Z'),
      new Date('2026-02-10T00:00:00Z')
    )

    const data = (db.schedule.createMany as jest.Mock).mock.calls[0][0].data
    expect(data[0].scheduledFor).toEqual(new Date('2026-02-09T00:00:00Z'))
  })
})

describe('ensureBiweeklyPinnedSchedules', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(db.schedule.count as jest.Mock).mockResolvedValue(0)
  })

  it('should return zero and skip createMany when no biweekly pinned chores exist', async () => {
    ;(db.chore.findMany as jest.Mock).mockResolvedValue([])

    const result = await ensureBiweeklyPinnedSchedules(new Date('2026-02-07T10:00:00Z'))

    expect(result).toEqual({ created: 0 })
    expect(db.schedule.createMany).not.toHaveBeenCalled()
  })

  it('should create schedules every other week based on the stored anchor', async () => {
    // Range includes Sundays: 2026-02-08, 2026-02-15, 2026-02-22.
    ;(db.chore.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'biweekly-1',
        biweeklyAutoPlanDay: 6, // Sunday (Mon=0..Sun=6)
        biweeklyAutoPlanAnchor: new Date('2026-02-08T00:00:00Z'),
      },
    ])
    ;(db.schedule.createMany as jest.Mock).mockResolvedValue({ count: 2 })

    const result = await ensureBiweeklyPinnedSchedules(
      new Date('2026-02-07T10:00:00Z'),
      new Date('2026-03-01T00:00:00Z'),
    )

    expect(result).toEqual({ created: 2 })

    expect(db.schedule.createMany).toHaveBeenCalledWith({
      data: [
        { choreId: 'biweekly-1', scheduledFor: new Date('2026-02-08T00:00:00Z'), slotType: 'DAILY', suggested: false },
        { choreId: 'biweekly-1', scheduledFor: new Date('2026-02-22T00:00:00Z'), slotType: 'DAILY', suggested: false },
      ],
      skipDuplicates: true,
    })
  })

  it('should skip createMany when all biweekly pinned schedules already exist', async () => {
    ;(db.chore.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'biweekly-1',
        biweeklyAutoPlanDay: 6,
        biweeklyAutoPlanAnchor: new Date('2026-02-08T00:00:00Z'),
      },
    ])
    ;(db.schedule.count as jest.Mock).mockResolvedValue(2)
    ;(db.schedule.createMany as jest.Mock).mockResolvedValue({ count: 0 })

    const result = await ensureBiweeklyPinnedSchedules(
      new Date('2026-02-07T10:00:00Z'),
      new Date('2026-03-01T00:00:00Z'),
    )

    expect(result).toEqual({ created: 0 })
    expect(db.schedule.createMany).not.toHaveBeenCalled()
  })
})

describe('rollForwardUnfinishedSchedulesToToday', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(db.schedule.updateMany as jest.Mock).mockResolvedValue({ count: 0 })
  })

  it('should return zero when no unfinished past schedules exist', async () => {
    ;(db.schedule.findMany as jest.Mock).mockResolvedValueOnce([])

    const result = await rollForwardUnfinishedSchedulesToToday(new Date('2026-02-10T12:00:00Z'))

    expect(result).toEqual({ moved: 0, hiddenAsDuplicate: 0 })
    expect(db.schedule.updateMany).not.toHaveBeenCalled()
    expect(db.schedule.findMany).toHaveBeenCalledTimes(1)
    expect(db.schedule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          hidden: false,
          completion: { is: null },
          scheduledFor: { lt: new Date('2026-02-10T00:00:00Z') },
        }),
      }),
    )
  })

  it('should move unfinished past schedules to today when no duplicate exists', async () => {
    ;(db.schedule.findMany as jest.Mock)
      .mockResolvedValueOnce([
        {
          id: 's1',
          choreId: 'c1',
          scheduledFor: new Date('2026-02-09T00:00:00Z'),
          createdAt: new Date('2026-02-01T00:00:00Z'),
        },
      ])
      .mockResolvedValueOnce([])
    ;(db.schedule.updateMany as jest.Mock).mockResolvedValueOnce({ count: 1 })

    const result = await rollForwardUnfinishedSchedulesToToday(new Date('2026-02-10T12:00:00Z'))

    expect(result).toEqual({ moved: 1, hiddenAsDuplicate: 0 })
    expect(db.schedule.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['s1'] } },
      data: { scheduledFor: new Date('2026-02-10T00:00:00Z') },
    })
  })

  it('should hide unfinished past schedules when same chore already exists today', async () => {
    ;(db.schedule.findMany as jest.Mock)
      .mockResolvedValueOnce([
        {
          id: 's-old',
          choreId: 'c1',
          scheduledFor: new Date('2026-02-09T00:00:00Z'),
          createdAt: new Date('2026-02-01T00:00:00Z'),
        },
      ])
      .mockResolvedValueOnce([{ choreId: 'c1' }])
    ;(db.schedule.updateMany as jest.Mock).mockResolvedValueOnce({ count: 1 })

    const result = await rollForwardUnfinishedSchedulesToToday(new Date('2026-02-10T12:00:00Z'))

    expect(result).toEqual({ moved: 0, hiddenAsDuplicate: 1 })
    expect(db.schedule.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['s-old'] } },
      data: { hidden: true },
    })
  })

  it('should move only one row per chore and hide older duplicates', async () => {
    ;(db.schedule.findMany as jest.Mock)
      .mockResolvedValueOnce([
        {
          id: 's1',
          choreId: 'c1',
          scheduledFor: new Date('2026-02-08T00:00:00Z'),
          createdAt: new Date('2026-02-01T00:00:00Z'),
        },
        {
          id: 's2',
          choreId: 'c1',
          scheduledFor: new Date('2026-02-09T00:00:00Z'),
          createdAt: new Date('2026-02-02T00:00:00Z'),
        },
        {
          id: 's3',
          choreId: 'c2',
          scheduledFor: new Date('2026-02-07T00:00:00Z'),
          createdAt: new Date('2026-02-01T00:00:00Z'),
        },
      ])
      .mockResolvedValueOnce([])
    ;(db.schedule.updateMany as jest.Mock)
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 2 })

    const result = await rollForwardUnfinishedSchedulesToToday(new Date('2026-02-10T12:00:00Z'))

    expect(result).toEqual({ moved: 2, hiddenAsDuplicate: 1 })
    expect(db.schedule.updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: { in: ['s2'] } },
      data: { hidden: true },
    })
    expect(db.schedule.updateMany).toHaveBeenNthCalledWith(2, {
      where: { id: { in: ['s1', 's3'] } },
      data: { scheduledFor: new Date('2026-02-10T00:00:00Z') },
    })
  })
})
