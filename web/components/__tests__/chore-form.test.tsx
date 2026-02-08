import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChoreForm } from '@/components/chore-form'

const toastSuccess = jest.fn()
const toastError = jest.fn()

jest.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}))

describe('ChoreForm', () => {
  it('validates required title', async () => {
    const user = userEvent.setup()
    render(
      <ChoreForm open onOpenChange={() => {}} users={[{ id: 'u1', name: 'Alice' }]} />
    )

    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Title is required')).toBeInTheDocument()
  })

  it('submits to the create endpoint and closes on success', async () => {
    const user = userEvent.setup()
    const onOpenChange = jest.fn()
    const onSaved = jest.fn()

    const originalFetch = globalThis.fetch
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: true } as unknown as Response)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).fetch = fetchMock

    render(
      <ChoreForm
        open
        onOpenChange={onOpenChange}
        onSaved={onSaved}
        users={[{ id: 'u1', name: 'Alice' }]}
      />
    )

    await user.type(screen.getByPlaceholderText('e.g., Vacuum the living room'), 'Vacuum')
    await user.click(screen.getByLabelText('Assign to Alice'))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/chores',
      expect.objectContaining({
        method: 'POST',
      })
    )

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onSaved).toHaveBeenCalledTimes(1)

    globalThis.fetch = originalFetch
  })

  it('allows setting weekly auto-schedule day for weekly chores', async () => {
    const user = userEvent.setup()
    const onOpenChange = jest.fn()

    const originalFetch = globalThis.fetch
    const fetchMock = jest.fn().mockResolvedValueOnce({ ok: true } as unknown as Response)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).fetch = fetchMock

    render(<ChoreForm open onOpenChange={onOpenChange} users={[{ id: 'u1', name: 'Alice' }]} />)

    await user.type(screen.getByPlaceholderText('e.g., Vacuum the living room'), 'Trash')

    // Weekly is the default frequency, so the auto-schedule control should be visible
    expect(screen.getByText('Auto-schedule on')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Auto-schedule weekday'))
    const listbox = await screen.findByRole('listbox')
    await user.click(within(listbox).getByText('Monday'))

    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    const call = fetchMock.mock.calls[0]
    const init = call[1] as { body: string }
    const parsed = JSON.parse(init.body)
    expect(parsed.frequency).toBe('WEEKLY')
    expect(parsed.weeklyAutoPlanDay).toBe(0)

    globalThis.fetch = originalFetch
  })

  it('allows setting biweekly auto-schedule day for biweekly chores', async () => {
    const user = userEvent.setup()
    const onOpenChange = jest.fn()

    const originalFetch = globalThis.fetch
    const fetchMock = jest.fn().mockResolvedValueOnce({ ok: true } as unknown as Response)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).fetch = fetchMock

    render(
      <ChoreForm
        open
        onOpenChange={onOpenChange}
        users={[{ id: 'u1', name: 'Alice' }]}
        initialValues={{
          id: 'c1',
          title: 'Car cleanup',
          description: null,
          frequency: 'BIWEEKLY',
          biweeklyAutoPlanDay: null,
          assigneeIds: [],
        }}
      />
    )

    expect(screen.getByText('Auto-schedule on')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Auto-schedule weekday'))
    const listbox = await screen.findByRole('listbox')
    await user.click(within(listbox).getByText('Sunday'))

    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    const call = fetchMock.mock.calls[0]
    expect(call[0]).toBe('/api/chores/c1')
    const init = call[1] as { body: string }
    const parsed = JSON.parse(init.body)
    expect(parsed.frequency).toBe('BIWEEKLY')
    expect(parsed.biweeklyAutoPlanDay).toBe(6)

    globalThis.fetch = originalFetch
  })
})
