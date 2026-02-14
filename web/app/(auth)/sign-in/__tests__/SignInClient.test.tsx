import { render, screen } from '@testing-library/react'

import SignInClient from '../SignInClient'

const mockPush = jest.fn()
const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

jest.mock('@/lib/auth/client', () => ({
  authClient: {
    signIn: {
      email: jest.fn(),
    },
  },
}))

describe('SignInClient', () => {
  it('shows a sign-up link when sign-up is enabled', () => {
    render(<SignInClient signUpEnabled />)

    const link = screen.getByRole('link', { name: 'Sign up' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/sign-up')
    expect(screen.queryByText('Accounts are invite-only for this household.')).not.toBeInTheDocument()
  })

  it('shows invite-only copy when sign-up is disabled', () => {
    render(<SignInClient signUpEnabled={false} />)

    expect(screen.queryByRole('link', { name: 'Sign up' })).not.toBeInTheDocument()
    expect(screen.getByText('Accounts are invite-only for this household.')).toBeInTheDocument()
  })
})
