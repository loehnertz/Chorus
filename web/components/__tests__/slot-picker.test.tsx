import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SlotPicker } from '@/components/slot-picker'

const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))

const toastSuccess = jest.fn()
const toastError = jest.fn()
const toastMessage = jest.fn()

jest.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
    message: (...args: unknown[]) => toastMessage(...args),
  },
}))

describe('SlotPicker', () => {
  it('loads suggestion and schedules it', async () => {
    const user = userEvent.setup()

    const originalFetch = globalThis.fetch
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          suggestion: {
            sourceFrequency: 'WEEKLY',
            chore: {
              id: 'c1',
              title: 'Weekly chore',
              description: null,
              frequency: 'WEEKLY',
            },
          },
          paceWarnings: [],
        }),
      } as unknown as Response)
      .mockResolvedValueOnce({ ok: true } as unknown as Response)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).fetch = fetchMock

    render(
      <SlotPicker
        slotType="DAILY"
        scheduledFor="2026-02-06T00:00:00.000Z"
        userId="u1"
        sourceChores={[{ id: 'c1', title: 'Weekly chore', frequency: 'WEEKLY' }]}
      />
    )

    const scheduleButton = screen.getByRole('button', { name: 'Schedule' })
    expect(scheduleButton).toBeDisabled()

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/schedules/suggest',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ currentFrequency: 'DAILY', userId: 'u1', forDate: '2026-02-06T00:00:00.000Z' }),
      })
    )

    await waitFor(() => expect(scheduleButton).toBeEnabled())
    expect(screen.queryByText(/Selected:/i)).not.toBeInTheDocument()

    await user.click(scheduleButton)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/schedules',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          choreId: 'c1',
          scheduledFor: '2026-02-06T00:00:00.000Z',
          slotType: 'DAILY',
          suggested: true,
        }),
      })
    )

    globalThis.fetch = originalFetch
  })

  it('disables chores already scheduled in the cycle and shows Scheduled badge', async () => {
    const originalFetch = globalThis.fetch
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          suggestion: {
            sourceFrequency: 'WEEKLY',
            chore: {
              id: 'c2',
              title: 'Unscheduled chore',
              description: null,
              frequency: 'WEEKLY',
            },
          },
          paceWarnings: [],
        }),
      } as unknown as Response)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).fetch = fetchMock

    render(
      <SlotPicker
        slotType="DAILY"
        scheduledFor="2026-02-04T00:00:00.000Z"
        userId="u1"
        sourceChores={[
          { id: 'c1', title: 'Already scheduled weekly', frequency: 'WEEKLY' },
          { id: 'c2', title: 'Unscheduled chore', frequency: 'WEEKLY' },
        ]}
        existingChoreIds={['c1']}
      />
    )

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    // The already-scheduled chore should be disabled
    const scheduledButton = screen.getByText('Already scheduled weekly').closest('button')
    expect(scheduledButton).toHaveAttribute('aria-disabled', 'true')
    expect(scheduledButton?.className).toContain('opacity-60')

    // Should show a "Scheduled" badge on the disabled item
    expect(screen.getByText('Scheduled')).toBeInTheDocument()

    // The unscheduled chore should NOT be disabled
    const unscheduledButton = screen.getByText('Unscheduled chore').closest('button')
    expect(unscheduledButton).not.toHaveAttribute('aria-disabled')

    globalThis.fetch = originalFetch
  })

  it('falls back to the first available chore when the suggestion is already scheduled in the cycle', async () => {
    const user = userEvent.setup()

    const originalFetch = globalThis.fetch
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          suggestion: {
            sourceFrequency: 'WEEKLY',
            chore: {
              id: 'c1',
              title: 'Already in cycle',
              description: null,
              frequency: 'WEEKLY',
            },
          },
          paceWarnings: [],
        }),
      } as unknown as Response)
      .mockResolvedValueOnce({ ok: true } as unknown as Response)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).fetch = fetchMock

    render(
      <SlotPicker
        slotType="DAILY"
        scheduledFor="2026-02-04T00:00:00.000Z"
        userId="u1"
        sourceChores={[
          { id: 'c1', title: 'Already in cycle', frequency: 'WEEKLY' },
          { id: 'c2', title: 'Available chore', frequency: 'WEEKLY' },
        ]}
        existingChoreIds={['c1']}
      />
    )

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const scheduleButton = screen.getByRole('button', { name: 'Schedule' })
    await waitFor(() => expect(scheduleButton).toBeEnabled())

    await user.click(scheduleButton)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/schedules',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          choreId: 'c2',
          scheduledFor: '2026-02-04T00:00:00.000Z',
          slotType: 'DAILY',
          suggested: false,
        }),
      })
    )

    globalThis.fetch = originalFetch
  })

  it('prevents clicking on a disabled chore and keeps original selection', async () => {
    const user = userEvent.setup()

    const originalFetch = globalThis.fetch
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          suggestion: {
            sourceFrequency: 'WEEKLY',
            chore: {
              id: 'c2',
              title: 'Available chore',
              description: null,
              frequency: 'WEEKLY',
            },
          },
          paceWarnings: [],
        }),
      } as unknown as Response)
      .mockResolvedValueOnce({ ok: true } as unknown as Response)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).fetch = fetchMock

    render(
      <SlotPicker
        slotType="DAILY"
        scheduledFor="2026-02-04T00:00:00.000Z"
        userId="u1"
        sourceChores={[
          { id: 'c1', title: 'Already in cycle', frequency: 'WEEKLY' },
          { id: 'c2', title: 'Available chore', frequency: 'WEEKLY' },
        ]}
        existingChoreIds={['c1']}
      />
    )

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    // Clicking on the disabled chore should not change selection
    const disabledButton = screen.getByText('Already in cycle').closest('button')
    await user.click(disabledButton!)

    // Schedule button should still be enabled (c2 was auto-selected via suggestion)
    const scheduleButton = screen.getByRole('button', { name: 'Schedule' })
    await waitFor(() => expect(scheduleButton).toBeEnabled())

    // Clicking Schedule should post c2 (the suggestion), not c1
    await user.click(scheduleButton)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/schedules',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          choreId: 'c2',
          scheduledFor: '2026-02-04T00:00:00.000Z',
          slotType: 'DAILY',
          suggested: true,
        }),
      })
    )

    globalThis.fetch = originalFetch
  })

  it('schedules a manually selected chore as non-suggested', async () => {
    const user = userEvent.setup()

    const originalFetch = globalThis.fetch
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          suggestion: {
            sourceFrequency: 'WEEKLY',
            chore: {
              id: 'c1',
              title: 'Suggested',
              description: null,
              frequency: 'WEEKLY',
            },
          },
        }),
      } as unknown as Response)
      .mockResolvedValueOnce({ ok: true } as unknown as Response)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).fetch = fetchMock

    render(
      <SlotPicker
        slotType="DAILY"
        scheduledFor="2026-02-06T00:00:00.000Z"
        sourceChores={[
          { id: 'c1', title: 'Suggested', frequency: 'WEEKLY' },
          { id: 'c2', title: 'Manual', frequency: 'WEEKLY' },
        ]}
      />
    )

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    const manualTitle = screen.getByText('Manual')
    const manualButton = manualTitle.closest('button')
    expect(manualButton).toBeTruthy()
    await user.click(manualButton!)

    expect(screen.queryByText(/Selected:/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Schedule' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/schedules',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          choreId: 'c2',
          scheduledFor: '2026-02-06T00:00:00.000Z',
          slotType: 'DAILY',
          suggested: false,
        }),
      })
    )

    globalThis.fetch = originalFetch
  })
})
