import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import SignUpClient from '../SignUpClient'

const mockPush = jest.fn()
const mockRefresh = jest.fn()
const mockSignUpEmail = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

jest.mock('@/lib/auth/client', () => ({
  authClient: {
    signUp: {
      email: (...args: unknown[]) => mockSignUpEmail(...args),
    },
  },
}))

describe('SignUpClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSignUpEmail.mockResolvedValue({})
  })

  it('creates account and redirects to pending approval', async () => {
    const user = userEvent.setup()
    render(<SignUpClient />)

    await user.type(screen.getByLabelText('Name'), 'Taylor')
    await user.type(screen.getByLabelText('Email'), 'taylor@example.com')
    await user.type(screen.getByLabelText('Password'), 'password-123')
    await user.type(screen.getByLabelText('Confirm password'), 'password-123')
    await user.click(screen.getByRole('button', { name: 'Sign Up' }))

    await waitFor(() => {
      expect(mockSignUpEmail).toHaveBeenCalledWith({
        name: 'Taylor',
        email: 'taylor@example.com',
        password: 'password-123',
      })
    })
    expect(mockPush).toHaveBeenCalledWith('/pending-approval')
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('shows validation error when passwords do not match', async () => {
    const user = userEvent.setup()
    render(<SignUpClient />)

    await user.type(screen.getByLabelText('Name'), 'Taylor')
    await user.type(screen.getByLabelText('Email'), 'taylor@example.com')
    await user.type(screen.getByLabelText('Password'), 'password-123')
    await user.type(screen.getByLabelText('Confirm password'), 'different-password')
    await user.click(screen.getByRole('button', { name: 'Sign Up' }))

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    expect(mockSignUpEmail).not.toHaveBeenCalled()
  })

  it('shows API error message when sign-up fails', async () => {
    const user = userEvent.setup()
    mockSignUpEmail.mockResolvedValue({
      error: { message: 'Email already in use' },
    })

    render(<SignUpClient />)

    await user.type(screen.getByLabelText('Name'), 'Taylor')
    await user.type(screen.getByLabelText('Email'), 'taylor@example.com')
    await user.type(screen.getByLabelText('Password'), 'password-123')
    await user.type(screen.getByLabelText('Confirm password'), 'password-123')
    await user.click(screen.getByRole('button', { name: 'Sign Up' }))

    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeInTheDocument()
    })
    expect(mockPush).not.toHaveBeenCalled()
  })
})
