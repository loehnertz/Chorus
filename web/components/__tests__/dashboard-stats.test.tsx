import { render, screen } from '@testing-library/react'
import { DashboardStats } from '../dashboard-stats'

describe('DashboardStats', () => {
  it('renders all stat cards', () => {
    render(
      <DashboardStats
        assignedChores={4}
        openToday={2}
        completedThisWeek={9}
        completedTotal={42}
      />
    )

    expect(screen.getByText('Assigned to You')).toBeInTheDocument()
    expect(screen.getByText('Open Today')).toBeInTheDocument()
    expect(screen.getByText('Done This Week')).toBeInTheDocument()
    expect(screen.getByText('Total Completed')).toBeInTheDocument()

    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('9')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })
})
