import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChoresView } from '@/components/chores-view'

const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))

describe('ChoresView', () => {
  it('shows an empty state when there are no chores', () => {
    render(<ChoresView chores={[]} users={[]} />)
    expect(screen.getByText('No chores yet')).toBeInTheDocument()
  })

  it('opens the add chore dialog from the CTA', async () => {
    const user = userEvent.setup()
    render(<ChoresView chores={[]} users={[{ id: 'u1', name: 'Alice' }]} />)

    const buttons = screen.getAllByRole('button', { name: 'Add Chore' })
    await user.click(buttons[0])
    expect(await screen.findByRole('heading', { name: 'Add Chore' })).toBeInTheDocument()
  })
})
