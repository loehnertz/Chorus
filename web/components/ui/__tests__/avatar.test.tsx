import { render, screen } from '@testing-library/react'
import { Avatar } from '@/components/ui/avatar'

describe('Avatar', () => {
  it('renders the first letter of the name', () => {
    render(<Avatar name="Alice" userId="user-1" />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('uses a deterministic color based on userId', () => {
    const { rerender } = render(<Avatar name="Alice" userId="same" />)
    const first = screen.getByLabelText('Alice')
    const firstClass = first.className
    rerender(<Avatar name="Alice" userId="same" />)
    const second = screen.getByLabelText('Alice')
    expect(second.className).toBe(firstClass)
  })
})
