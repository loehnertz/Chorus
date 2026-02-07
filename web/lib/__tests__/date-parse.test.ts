import { parseUtcDateInput } from '@/lib/date'

describe('parseUtcDateInput', () => {
  it('parses date-only strings as UTC midnight', () => {
    const parsed = parseUtcDateInput('2026-02-15')
    expect(parsed?.toISOString()).toBe('2026-02-15T00:00:00.000Z')
  })

  it('accepts ISO datetimes with timezone', () => {
    const parsed = parseUtcDateInput('2026-02-15T12:34:56Z')
    expect(parsed?.toISOString()).toBe('2026-02-15T12:34:56.000Z')
  })

  it('rejects ISO datetimes without timezone', () => {
    // This would parse as local time in JS, which is ambiguous for API contracts.
    expect(parseUtcDateInput('2026-02-15T00:00:00')).toBeNull()
  })
})
