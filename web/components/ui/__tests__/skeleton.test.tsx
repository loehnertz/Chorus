import { render, screen } from '@testing-library/react'
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonText } from '@/components/ui/skeleton'

describe('Skeleton', () => {
  it('renders default skeleton', () => {
    render(<Skeleton data-testid="s" />)
    expect(screen.getByTestId('s')).toHaveClass('animate-pulse')
  })

  it('renders helper variants', () => {
    render(
      <div>
        <SkeletonText data-testid="t" />
        <SkeletonCard data-testid="c" />
        <SkeletonCircle data-testid="o" />
      </div>
    )

    expect(screen.getByTestId('t')).toHaveClass('h-4')
    expect(screen.getByTestId('c')).toHaveClass('rounded-[var(--radius-lg)]')
    expect(screen.getByTestId('o')).toHaveClass('rounded-full')
  })
})
