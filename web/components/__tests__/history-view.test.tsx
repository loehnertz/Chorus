import { render, screen } from '@testing-library/react'
import { HistoryView } from '@/components/history-view'
import { formatLocalDateTimeCompact } from '@/lib/format-local-datetime'

describe('HistoryView', () => {
  it('renders an empty state', () => {
    render(<HistoryView currentUserId="u1" scope="mine" items={[]} />)

    expect(screen.getByText('History')).toBeInTheDocument()
    expect(screen.getByText('No completions yet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mine' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Household' })).toBeInTheDocument()
  })

  it('shows household items with user labels', async () => {
    const aIso = '2026-02-07T12:00:00.000Z'
    const bIso = '2026-02-07T12:05:00.000Z'
    const aLabel = formatLocalDateTimeCompact(aIso)
    const bLabel = formatLocalDateTimeCompact(bIso)

    render(
      <HistoryView
        currentUserId="me"
        scope="household"
        items={[
          {
            id: 'c1',
            title: 'Vacuum',
            frequency: 'WEEKLY',
            completedAtIso: aIso,
            scheduleId: 's1',
            notes: null,
            user: { id: 'me', name: 'Alice' },
          },
          {
            id: 'c2',
            title: 'Dishes',
            frequency: 'DAILY',
            completedAtIso: bIso,
            scheduleId: null,
            notes: 'Kitchen only',
            user: { id: 'u2', name: 'Bob' },
          },
        ]}
      />
    )

    expect(screen.getByText('Vacuum')).toBeInTheDocument()
    expect(screen.getByText('Dishes')).toBeInTheDocument()
    expect(aLabel).not.toBeNull()
    expect(bLabel).not.toBeNull()
    expect(
      await screen.findByText((_, node) => {
        const text = node?.textContent ?? ''
        if (node?.tagName !== 'P') return false
        return text.includes(`You · ${aLabel}`) && text.includes('scheduled')
      })
    ).toBeInTheDocument()

    expect(
      await screen.findByText((_, node) => {
        const text = node?.textContent ?? ''
        if (node?.tagName !== 'P') return false
        return text.includes(`Bob · ${bLabel}`)
      })
    ).toBeInTheDocument()
    expect(screen.getByText('Kitchen only')).toBeInTheDocument()
  })
})
