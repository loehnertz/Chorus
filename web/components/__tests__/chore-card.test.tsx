import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Frequency } from '@prisma/client'
import { ChoreCard } from '../chore-card'

describe('ChoreCard', () => {
  it('renders chore details and triggers completion callback', async () => {
    const user = userEvent.setup()
    const onComplete = jest.fn()

    render(
      <ChoreCard
        chore={{
          id: 'chore-1',
          title: 'Do dishes',
          description: 'After dinner',
          frequency: Frequency.DAILY,
          assignments: [
            {
              id: 'assignment-1',
              userId: 'user-1',
              user: {
                id: 'user-1',
                name: 'Alex',
                image: null,
              },
            },
          ],
          _count: {
            completions: 3,
            schedules: 1,
          },
        }}
        onComplete={onComplete}
      />
    )

    expect(screen.getByText('Do dishes')).toBeInTheDocument()
    expect(screen.getByText('After dinner')).toBeInTheDocument()
    expect(screen.getByText('DAILY')).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: 'Mark Do dishes complete' }))

    expect(onComplete).toHaveBeenCalledWith('chore-1', undefined)
  })
})
