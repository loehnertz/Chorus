import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChoreForm } from '../chore-form'
import { ToastProvider } from '../toast-provider'

describe('ChoreForm', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('validates title before submitting', async () => {
    const user = userEvent.setup()

    render(
      <ToastProvider>
        <ChoreForm
          users={[]}
          onSuccess={jest.fn()}
        />
      </ToastProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Create Chore' }))

    expect(screen.getByText('Title is required')).toBeInTheDocument()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('submits create payload and invokes onSuccess', async () => {
    const user = userEvent.setup()
    const onSuccess = jest.fn()

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          id: 'chore-1',
          title: 'Vacuum',
          description: 'Living room',
          frequency: 'WEEKLY',
          assignments: [],
          _count: { completions: 0, schedules: 0 },
        },
      }),
    })

    render(
      <ToastProvider>
        <ChoreForm
          users={[
            {
              id: 'user-1',
              name: 'Alex',
              image: null,
            },
          ]}
          onSuccess={onSuccess}
        />
      </ToastProvider>
    )

    await user.type(screen.getByLabelText('Title'), 'Vacuum')
    await user.type(screen.getByLabelText('Description'), 'Living room')
    await user.selectOptions(screen.getByLabelText('Frequency'), 'WEEKLY')
    await user.click(screen.getByLabelText('Alex'))

    await user.click(screen.getByRole('button', { name: 'Create Chore' }))

    expect(global.fetch).toHaveBeenCalledWith('/api/chores', expect.objectContaining({ method: 'POST' }))
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })
})
