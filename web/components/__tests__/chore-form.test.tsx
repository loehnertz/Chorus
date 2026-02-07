import { render, screen, waitFor } from '@testing-library/react'
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
})
