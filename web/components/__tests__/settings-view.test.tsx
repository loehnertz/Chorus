import { render, screen } from '@testing-library/react'
import { SettingsView } from '@/components/settings-view'

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] })
})
afterEach(() => {
  jest.restoreAllMocks()
})

describe('SettingsView', () => {
  it('renders the settings page title and subtitle', () => {
    render(<SettingsView />)

    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Manage your notifications and holidays.')).toBeInTheDocument()
  })

  it('renders the Reminders and Holiday Mode sections', () => {
    render(<SettingsView />)

    expect(screen.getByText('Reminders')).toBeInTheDocument()
    expect(screen.getByText('Holiday Mode')).toBeInTheDocument()
  })
})
