import { isDateInHoliday, buildHolidayDayKeySet } from '@/lib/holiday'

describe('isDateInHoliday', () => {
  const holidays = [
    {
      startDate: new Date('2026-03-10T00:00:00.000Z'),
      endDate: new Date('2026-03-14T00:00:00.000Z'),
    },
  ]

  it('returns true for a date within the holiday', () => {
    expect(isDateInHoliday(new Date('2026-03-12T00:00:00.000Z'), holidays)).toBe(true)
  })

  it('returns true for start date (inclusive)', () => {
    expect(isDateInHoliday(new Date('2026-03-10T00:00:00.000Z'), holidays)).toBe(true)
  })

  it('returns true for end date (inclusive)', () => {
    expect(isDateInHoliday(new Date('2026-03-14T00:00:00.000Z'), holidays)).toBe(true)
  })

  it('returns false for a date before the holiday', () => {
    expect(isDateInHoliday(new Date('2026-03-09T00:00:00.000Z'), holidays)).toBe(false)
  })

  it('returns false for a date after the holiday', () => {
    expect(isDateInHoliday(new Date('2026-03-15T00:00:00.000Z'), holidays)).toBe(false)
  })

  it('returns false for empty holidays', () => {
    expect(isDateInHoliday(new Date('2026-03-12T00:00:00.000Z'), [])).toBe(false)
  })

  it('handles multiple holidays', () => {
    const multi = [
      { startDate: new Date('2026-01-01T00:00:00.000Z'), endDate: new Date('2026-01-03T00:00:00.000Z') },
      { startDate: new Date('2026-06-15T00:00:00.000Z'), endDate: new Date('2026-06-20T00:00:00.000Z') },
    ]
    expect(isDateInHoliday(new Date('2026-01-02T00:00:00.000Z'), multi)).toBe(true)
    expect(isDateInHoliday(new Date('2026-06-18T00:00:00.000Z'), multi)).toBe(true)
    expect(isDateInHoliday(new Date('2026-03-01T00:00:00.000Z'), multi)).toBe(false)
  })
})

describe('buildHolidayDayKeySet', () => {
  it('builds a set of all day keys within the holiday range', () => {
    const holidays = [
      {
        startDate: new Date('2026-02-05T00:00:00.000Z'),
        endDate: new Date('2026-02-08T00:00:00.000Z'),
      },
    ]
    const keys = buildHolidayDayKeySet(holidays)
    expect(keys.size).toBe(4)
    expect(keys.has('2026-02-05')).toBe(true)
    expect(keys.has('2026-02-06')).toBe(true)
    expect(keys.has('2026-02-07')).toBe(true)
    expect(keys.has('2026-02-08')).toBe(true)
    expect(keys.has('2026-02-04')).toBe(false)
    expect(keys.has('2026-02-09')).toBe(false)
  })

  it('handles a single-day holiday', () => {
    const holidays = [
      {
        startDate: new Date('2026-05-01T00:00:00.000Z'),
        endDate: new Date('2026-05-01T00:00:00.000Z'),
      },
    ]
    const keys = buildHolidayDayKeySet(holidays)
    expect(keys.size).toBe(1)
    expect(keys.has('2026-05-01')).toBe(true)
  })

  it('merges overlapping holidays', () => {
    const holidays = [
      { startDate: new Date('2026-01-01T00:00:00.000Z'), endDate: new Date('2026-01-03T00:00:00.000Z') },
      { startDate: new Date('2026-01-02T00:00:00.000Z'), endDate: new Date('2026-01-04T00:00:00.000Z') },
    ]
    const keys = buildHolidayDayKeySet(holidays)
    expect(keys.size).toBe(4) // Jan 1–4
  })

  it('respects maxDays safety cap', () => {
    const holidays = [
      {
        startDate: new Date('2020-01-01T00:00:00.000Z'),
        endDate: new Date('2030-12-31T00:00:00.000Z'),
      },
    ]
    const keys = buildHolidayDayKeySet(holidays, 100)
    expect(keys.size).toBe(100)
  })

  it('handles empty holidays', () => {
    const keys = buildHolidayDayKeySet([])
    expect(keys.size).toBe(0)
  })
})
