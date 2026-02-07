import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CompletionCheckbox } from '@/components/completion-checkbox'

describe('CompletionCheckbox', () => {
  it('calls onCheckedChange when toggled', async () => {
    const user = userEvent.setup()
    const onCheckedChange = jest.fn()

    render(<CompletionCheckbox checked={false} onCheckedChange={onCheckedChange} />)
    await user.click(screen.getByRole('checkbox'))

    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup()
    const onCheckedChange = jest.fn()

    render(<CompletionCheckbox checked={false} disabled onCheckedChange={onCheckedChange} />)
    await user.click(screen.getByRole('checkbox'))

    expect(onCheckedChange).not.toHaveBeenCalled()
  })
})
