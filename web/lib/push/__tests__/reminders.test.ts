import {
  buildReminderNotificationPayload,
  filterSchedulesForUser,
  getLocalDayKey,
  shouldSendReminder,
} from '@/lib/push/reminders'

describe('push reminders helpers', () => {
  it('formats a local day key', () => {
    const dt = new Date('2026-02-08T12:00:00Z')
    expect(getLocalDayKey(dt, 'UTC')).toBe('2026-02-08')
  })

  it('always allows sending (dedupe handled elsewhere)', () => {
    const now = new Date('2026-02-08T09:15:00Z')
    expect(shouldSendReminder(now, 'UTC').send).toBe(true)
  })

  it('filters schedules by assignment', () => {
    const schedules = [
      {
        id: 's1',
        scheduledFor: new Date('2026-02-08T00:00:00Z'),
        chore: { title: 'A', frequency: 'DAILY', assignments: [] },
      },
      {
        id: 's2',
        scheduledFor: new Date('2026-02-08T00:00:00Z'),
        chore: { title: 'B', frequency: 'DAILY', assignments: [{ userId: 'u2' }] },
      },
    ] as const

    expect(filterSchedulesForUser(schedules as never, 'u1').map((s) => s.id)).toEqual(['s1'])
  })

  it('builds a digest payload', () => {
    const payload = buildReminderNotificationPayload({
      kind: 'daily',
      dayKey: '2026-02-08',
      incomplete: [{ title: 'Dishes' }, { title: 'Laundry' }, { title: 'Vacuum' }, { title: 'Trash' }],
    })
    expect(payload.title).toContain('4')
    expect(payload.tag).toBe('chorus-reminder-daily-2026-02-08')
  })
})
