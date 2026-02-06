import { render, screen } from '@testing-library/react'
import { FrequencyBadge } from '@/components/ui/frequency-badge'
import type { Frequency } from '@/types/frequency'

describe('FrequencyBadge', () => {
  it('renders the frequency label', () => {
    render(<FrequencyBadge frequency={'DAILY' as Frequency} />)
    expect(screen.getByText('DAILY')).toBeInTheDocument()
  })

  it('applies distinct variant styling per frequency', () => {
    const { rerender } = render(<FrequencyBadge frequency={'DAILY' as Frequency} />)
    expect(screen.getByText('DAILY')).toHaveClass('text-[var(--color-terracotta)]')

    rerender(<FrequencyBadge frequency={'WEEKLY' as Frequency} />)
    expect(screen.getByText('WEEKLY')).toHaveClass('text-[var(--color-sage)]')

    rerender(<FrequencyBadge frequency={'MONTHLY' as Frequency} />)
    expect(screen.getByText('MONTHLY')).toHaveClass('text-[var(--color-charcoal)]')

    rerender(<FrequencyBadge frequency={'YEARLY' as Frequency} />)
    expect(screen.getByText('YEARLY')).toHaveClass('bg-[var(--color-cream)]')
  })
})
