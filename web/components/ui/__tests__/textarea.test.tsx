import { render, screen } from '@testing-library/react'
import { Textarea } from '@/components/ui/textarea'

describe('Textarea', () => {
  it('renders with base styling and passes props through', () => {
    render(<Textarea placeholder="Notes" aria-label="notes" />)
    const textarea = screen.getByLabelText('notes')
    expect(textarea).toBeInTheDocument()
    expect(textarea).toHaveAttribute('placeholder', 'Notes')
    expect(textarea).toHaveClass('min-h-[100px]')
  })
})
