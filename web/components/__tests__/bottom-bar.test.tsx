import { render, screen } from '@testing-library/react'
import { BottomBar } from '@/components/bottom-bar'

const mockUsePathname = jest.fn()

jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}))

describe('BottomBar', () => {
  it('marks the active tab', () => {
    mockUsePathname.mockReturnValue('/schedule')
    render(<BottomBar />)

    expect(screen.getByText('Schedule')).toHaveClass('text-[var(--color-terracotta)]')
    expect(screen.getByText('Dashboard')).not.toHaveClass('text-[var(--color-terracotta)]')
  })
})
