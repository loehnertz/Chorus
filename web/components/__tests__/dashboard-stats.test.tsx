import { render, screen } from '@testing-library/react'
import { DashboardStats } from '@/components/dashboard-stats'

describe('DashboardStats', () => {
  it('renders the four stat cards', () => {
    render(
      <DashboardStats
        stats={{ completedTotal: 10, completedThisWeek: 2, streakDays: 3, choresCount: 12 }}
      />
    )

    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('This Week')).toBeInTheDocument()
    expect(screen.getByText('Streak')).toBeInTheDocument()
    expect(screen.getByText('Chores')).toBeInTheDocument()

    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })
})
