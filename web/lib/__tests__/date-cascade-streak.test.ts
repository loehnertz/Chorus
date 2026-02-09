import { dayKeyUtc, startOfTodayUtc, startOfTomorrowUtc, startOfWeekUtc } from '@/lib/date'
import { getCascadeSourceFrequency } from '@/lib/cascade'
import { computeStreakDaysUtc } from '@/lib/streak'

describe('date utils (UTC)', () => {
  it('computes start of today/tomorrow', () => {
    const now = new Date('2026-02-07T15:04:05.000Z')
    expect(startOfTodayUtc(now).toISOString()).toBe('2026-02-07T00:00:00.000Z')
    expect(startOfTomorrowUtc(now).toISOString()).toBe('2026-02-08T00:00:00.000Z')
  })

  it('computes start of week (Monday)', () => {
    // 2026-02-08 is a Sunday
    const now = new Date('2026-02-08T10:00:00.000Z')
    expect(startOfWeekUtc(now).toISOString()).toBe('2026-02-02T00:00:00.000Z')
  })

  it('builds day keys', () => {
    expect(dayKeyUtc(new Date('2026-02-07T00:00:00.000Z'))).toBe('2026-02-07')
  })
})

describe('cascade utils', () => {
  it('maps to the next higher frequency', () => {
    expect(getCascadeSourceFrequency('DAILY')).toBe('WEEKLY')
    expect(getCascadeSourceFrequency('WEEKLY')).toBe('BIWEEKLY')
    expect(getCascadeSourceFrequency('BIWEEKLY')).toBe('MONTHLY')
    expect(getCascadeSourceFrequency('MONTHLY')).toBe('BIMONTHLY')
    expect(getCascadeSourceFrequency('BIMONTHLY')).toBe('SEMIANNUAL')
    expect(getCascadeSourceFrequency('SEMIANNUAL')).toBe('YEARLY')
    expect(getCascadeSourceFrequency('YEARLY')).toBeNull()
  })
})

describe('streak', () => {
  it('counts consecutive days ending today', () => {
    const now = new Date('2026-02-07T12:00:00.000Z')
    const dates = [
      new Date('2026-02-07T01:00:00.000Z'),
      new Date('2026-02-06T01:00:00.000Z'),
      new Date('2026-02-05T01:00:00.000Z'),
      // Extra completion same day should not double count.
      new Date('2026-02-05T20:00:00.000Z'),
    ]

    expect(computeStreakDaysUtc(dates, now)).toBe(3)
  })

  it('stops at the first missing day', () => {
    const now = new Date('2026-02-07T12:00:00.000Z')
    const dates = [
      new Date('2026-02-07T01:00:00.000Z'),
      new Date('2026-02-05T01:00:00.000Z'),
    ]

    expect(computeStreakDaysUtc(dates, now)).toBe(1)
  })

  it('bridges across holiday days', () => {
    // Completed day 1 (Feb 4), holiday days 5-6, completed day 7 (Feb 7)
    const now = new Date('2026-02-07T12:00:00.000Z')
    const dates = [
      new Date('2026-02-07T01:00:00.000Z'),
      new Date('2026-02-04T01:00:00.000Z'),
    ]
    const holidays = new Set(['2026-02-05', '2026-02-06'])

    expect(computeStreakDaysUtc(dates, now, holidays)).toBe(2)
  })

  it('does not count holiday days as streak days', () => {
    // Only holidays, no completions
    const now = new Date('2026-02-07T12:00:00.000Z')
    const holidays = new Set(['2026-02-07', '2026-02-06'])

    expect(computeStreakDaysUtc([], now, holidays)).toBe(0)
  })

  it('skips holiday at start then counts completions', () => {
    // Today (Feb 7) is a holiday, completed Feb 6 and Feb 5
    const now = new Date('2026-02-07T12:00:00.000Z')
    const dates = [
      new Date('2026-02-06T01:00:00.000Z'),
      new Date('2026-02-05T01:00:00.000Z'),
    ]
    const holidays = new Set(['2026-02-07'])

    expect(computeStreakDaysUtc(dates, now, holidays)).toBe(2)
  })

  it('works without holiday parameter (backwards compatible)', () => {
    const now = new Date('2026-02-07T12:00:00.000Z')
    const dates = [
      new Date('2026-02-07T01:00:00.000Z'),
      new Date('2026-02-06T01:00:00.000Z'),
    ]

    expect(computeStreakDaysUtc(dates, now)).toBe(2)
    expect(computeStreakDaysUtc(dates, now, undefined)).toBe(2)
  })
})
