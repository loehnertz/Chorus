import { render, screen } from '@testing-library/react'
import { DashboardPlanningWarnings } from '@/components/dashboard-planning-warnings'

describe('DashboardPlanningWarnings', () => {
  it('renders nothing when there are no warnings', () => {
    const { container } = render(<DashboardPlanningWarnings warnings={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders cycle warning rows', () => {
    render(
      <DashboardPlanningWarnings
        warnings={[
          {
            frequency: 'WEEKLY',
            cycleStart: new Date('2026-02-02T00:00:00Z'),
            cycleEnd: new Date('2026-02-09T00:00:00Z'),
            remainingFraction: 0.18,
            unscheduledChores: [
              { id: 'w1', title: 'Take out trash' },
              { id: 'w2', title: 'Vacuum' },
            ],
          },
        ]}
      />
    )

    expect(screen.getByText('Planning warnings')).toBeInTheDocument()
    expect(screen.getByText(/Weekly cycle: 18% remaining/)).toBeInTheDocument()
    expect(screen.getByText(/Unscheduled \(2\): Take out trash, Vacuum/)).toBeInTheDocument()
  })
})
