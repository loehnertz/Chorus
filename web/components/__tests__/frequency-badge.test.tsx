import { render, screen } from '@testing-library/react'
import { Frequency } from '@prisma/client'
import { FrequencyBadge } from '../frequency-badge'

describe('FrequencyBadge', () => {
  it('renders the frequency label', () => {
    render(<FrequencyBadge frequency={Frequency.MONTHLY} />)

    expect(screen.getByText('MONTHLY')).toBeInTheDocument()
  })
})
