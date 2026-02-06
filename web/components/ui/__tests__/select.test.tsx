import * as React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function TestSelect() {
  const [value, setValue] = React.useState<string>('')
  return (
    <Select value={value} onValueChange={setValue}>
      <SelectTrigger aria-label="frequency">
        <SelectValue placeholder="Pick one" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="DAILY">Daily</SelectItem>
        <SelectItem value="WEEKLY">Weekly</SelectItem>
      </SelectContent>
    </Select>
  )
}

describe('Select', () => {
  it('allows selecting an item', async () => {
    const user = userEvent.setup()
    render(<TestSelect />)

    await user.click(screen.getByLabelText('frequency'))
    await user.click(await screen.findByText('Weekly'))

    expect(screen.getByText('Weekly')).toBeInTheDocument()
  })
})
