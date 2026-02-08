import { render, screen, waitFor } from '@testing-library/react'

import { SchedulePageClient } from '../SchedulePageClient'

jest.mock('@/components/schedule-view', () => ({
  ScheduleView: () => <div data-testid="schedule-view" />,
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('SchedulePageClient', () => {
  beforeEach(() => {
    ;(globalThis as unknown as { fetch: unknown }).fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders the schedule skeleton while loading', async () => {
    const pending = deferred<unknown>()
    ;(global.fetch as jest.Mock).mockReturnValueOnce(pending.promise)

    render(<SchedulePageClient month="2026-02" />)

    expect(screen.getByTestId('schedule-loading')).toBeInTheDocument()

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))
    expect(global.fetch).toHaveBeenCalledWith('/api/schedule-view?month=2026-02')

    pending.resolve({
      ok: true,
      json: async () => ({
        userId: 'u1',
        year: 2026,
        monthIndex: 1,
        todayDayKey: '2026-02-06',
        initialSelectedDayKey: '2026-02-06',
        chores: [],
        monthSchedules: [],
        upcomingSchedules: [],
        longRangeScheduledChoreIds: {},
        users: [],
      }),
    })

    await waitFor(() => expect(screen.getByTestId('schedule-view')).toBeInTheDocument())
  })

  it('shows the skeleton again when month changes', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          userId: 'u1',
          year: 2026,
          monthIndex: 1,
          todayDayKey: '2026-02-06',
          initialSelectedDayKey: '2026-02-06',
          chores: [],
          monthSchedules: [],
          upcomingSchedules: [],
          longRangeScheduledChoreIds: {},
          users: [],
        }),
      })

    const pending = deferred<unknown>()
    ;(global.fetch as jest.Mock).mockReturnValueOnce(pending.promise)

    const { rerender } = render(<SchedulePageClient month="2026-02" />)

    await waitFor(() => expect(screen.getByTestId('schedule-view')).toBeInTheDocument())

    rerender(<SchedulePageClient month="2026-03" />)

    await waitFor(() => expect(screen.getByTestId('schedule-loading')).toBeInTheDocument())
    await waitFor(() => expect(global.fetch).toHaveBeenLastCalledWith('/api/schedule-view?month=2026-03'))

    pending.resolve({
      ok: true,
      json: async () => ({
        userId: 'u1',
        year: 2026,
        monthIndex: 2,
        todayDayKey: '2026-03-06',
        initialSelectedDayKey: '2026-03-06',
        chores: [],
        monthSchedules: [],
        upcomingSchedules: [],
        longRangeScheduledChoreIds: {},
        users: [],
      }),
    })

    await waitFor(() => expect(screen.getByTestId('schedule-view')).toBeInTheDocument())
  })
})
