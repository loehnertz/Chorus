import {
  computeProgressFromCompletionMap,
  computeTodayProgressFromScheduleItems,
  getCelebrationStorageKey,
  hasCelebratedToday,
  markCelebratedToday,
  shouldTriggerZeroInboxCelebration,
  toTodayProgress,
} from '../gamification'

function createStorageMock() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
  }
}

describe('gamification helpers', () => {
  it('computes progress from completion map', () => {
    const progress = computeProgressFromCompletionMap(
      [{ scheduleId: 's1' }, { scheduleId: 's2' }, { scheduleId: 's3' }],
      { s1: 'u1', s3: null }
    )

    expect(progress).toEqual({ completed: 2, total: 3, percent: 67 })
  })

  it('computes today progress for actionable schedule items', () => {
    const progress = computeTodayProgressFromScheduleItems(
      [
        {
          scheduledFor: '2026-02-14T00:00:00.000Z',
          completed: true,
          chore: { assigneeIds: ['u1'] },
        },
        {
          scheduledFor: '2026-02-14T00:00:00.000Z',
          completed: false,
          chore: { assigneeIds: [] },
        },
        {
          scheduledFor: '2026-02-14T00:00:00.000Z',
          completed: true,
          chore: { assigneeIds: ['u2'] },
        },
        {
          scheduledFor: '2026-02-15T00:00:00.000Z',
          completed: true,
          chore: { assigneeIds: ['u1'] },
        },
      ],
      'u1',
      '2026-02-14'
    )

    expect(progress).toEqual({ completed: 1, total: 2, percent: 50 })
  })

  it('triggers zero-inbox only on transition to completion', () => {
    expect(
      shouldTriggerZeroInboxCelebration({
        prevCompleted: 1,
        nextCompleted: 2,
        total: 2,
        alreadyCelebrated: false,
      })
    ).toBe(true)

    expect(
      shouldTriggerZeroInboxCelebration({
        prevCompleted: 2,
        nextCompleted: 2,
        total: 2,
        alreadyCelebrated: false,
      })
    ).toBe(false)

    expect(
      shouldTriggerZeroInboxCelebration({
        prevCompleted: 1,
        nextCompleted: 2,
        total: 2,
        alreadyCelebrated: true,
      })
    ).toBe(false)
  })

  it('marks celebration once per day in storage', () => {
    const storage = createStorageMock()
    const key = getCelebrationStorageKey('u1', '2026-02-14')

    expect(hasCelebratedToday('u1', '2026-02-14', storage)).toBe(false)
    markCelebratedToday('u1', '2026-02-14', storage)
    expect(hasCelebratedToday('u1', '2026-02-14', storage)).toBe(true)
    expect(storage.getItem(key)).toBe('1')
  })

  it('clamps today progress bounds', () => {
    expect(toTodayProgress(-2, 4)).toEqual({ completed: 0, total: 4, percent: 0 })
    expect(toTodayProgress(9, 4)).toEqual({ completed: 4, total: 4, percent: 100 })
    expect(toTodayProgress(1, 0)).toEqual({ completed: 0, total: 0, percent: 0 })
  })
})
