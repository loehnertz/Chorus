import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalendarCheck } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

describe('EmptyState', () => {
  it('renders title and optional subtitle', () => {
    render(
      <EmptyState
        icon={CalendarCheck}
        title="All clear!"
        subtitle="No tasks scheduled for today"
      />
    )

    expect(screen.getByText('All clear!')).toBeInTheDocument()
    expect(screen.getByText('No tasks scheduled for today')).toBeInTheDocument()
  })

  it('renders CTA button when provided', async () => {
    const user = userEvent.setup()
    const onCtaClick = jest.fn()

    render(
      <EmptyState
        icon={CalendarCheck}
        title="No chores yet"
        ctaLabel="Add Chore"
        onCtaClick={onCtaClick}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Add Chore' }))
    expect(onCtaClick).toHaveBeenCalledTimes(1)
  })
})
