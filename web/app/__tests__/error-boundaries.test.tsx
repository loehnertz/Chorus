import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GlobalError from '@/app/error'
import DashboardError from '@/app/(dashboard)/error'

describe('Error boundaries', () => {
  function createRedirectError() {
    return Object.assign(new Error('NEXT_REDIRECT'), {
      digest: 'NEXT_REDIRECT;replace;/dashboard;307;',
    })
  }

  it('GlobalError calls reset', async () => {
    const user = userEvent.setup()
    const reset = jest.fn()

    render(<GlobalError error={new Error('boom')} reset={reset} />)
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(reset).toHaveBeenCalledTimes(1)
  })

  it('DashboardError calls reset', async () => {
    const user = userEvent.setup()
    const reset = jest.fn()

    render(<DashboardError error={new Error('boom')} reset={reset} />)
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(reset).toHaveBeenCalledTimes(1)
  })

  it('GlobalError auto-recovers redirect errors', async () => {
    const reset = jest.fn()

    render(<GlobalError error={createRedirectError()} reset={reset} />)

    await waitFor(() => {
      expect(reset).toHaveBeenCalledTimes(1)
    })
  })

  it('DashboardError auto-recovers redirect errors', async () => {
    const reset = jest.fn()

    render(<DashboardError error={createRedirectError()} reset={reset} />)

    await waitFor(() => {
      expect(reset).toHaveBeenCalledTimes(1)
    })
  })
})
