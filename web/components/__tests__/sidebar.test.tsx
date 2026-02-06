import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sidebar } from '@/components/sidebar'

const mockUsePathname = jest.fn()
const mockPush = jest.fn()
const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

const mockSignOut = jest.fn()

jest.mock('@/lib/auth/client', () => ({
  authClient: {
    signOut: () => mockSignOut(),
  },
}))

describe('Sidebar', () => {
  it('highlights the active route', () => {
    mockUsePathname.mockReturnValue('/chores')

    render(<Sidebar user={{ id: 'u1', name: 'Alice' }} />)

    const choresLink = screen.getByRole('link', { name: 'Chores' })
    const dashboardLink = screen.getByRole('link', { name: 'Dashboard' })

    expect(choresLink).toHaveClass('bg-[var(--color-cream)]')
    expect(dashboardLink).not.toHaveClass('bg-[var(--color-cream)]')
  })

  it('signs out when clicking Sign Out', async () => {
    const user = userEvent.setup()
    mockUsePathname.mockReturnValue('/dashboard')

    render(<Sidebar user={{ id: 'u1', name: 'Alice' }} />)
    await user.click(screen.getByRole('button', { name: 'Sign Out' }))

    expect(mockSignOut).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith('/sign-in')
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })
})
