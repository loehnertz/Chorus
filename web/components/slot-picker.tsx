'use client'

import { useEffect, useMemo, useState } from 'react'
import { Frequency } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/toast-provider'
import type { ScheduleWithChore } from '@/types'

interface SlotPickerProps {
  availableChores: Array<{
    id: string
    title: string
    frequency: Frequency
  }>
  onScheduleCreated: (schedule: ScheduleWithChore) => void
}

interface SuggestionPayload {
  data?: {
    chore: {
      id: string
      title: string
    }
    lastCompletedAt: string | null
  }
  error?: string
}

const SLOT_OPTIONS: Frequency[] = [Frequency.WEEKLY, Frequency.MONTHLY]

const COMPATIBILITY: Record<Frequency, Frequency[]> = {
  DAILY: [],
  WEEKLY: [Frequency.DAILY, Frequency.MONTHLY],
  MONTHLY: [Frequency.YEARLY],
  YEARLY: [],
}

function toDateTimeLocalInputValue(date: Date): string {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

export function SlotPicker({ availableChores, onScheduleCreated }: SlotPickerProps) {
  const [slotType, setSlotType] = useState<Frequency>(Frequency.WEEKLY)
  const [scheduledFor, setScheduledFor] = useState(toDateTimeLocalInputValue(new Date()))
  const [manualMode, setManualMode] = useState(false)
  const [manualChoreId, setManualChoreId] = useState('')
  const [suggestedChore, setSuggestedChore] = useState<{ id: string; title: string; lastCompletedAt: string | null } | null>(null)
  const [loadingSuggestion, setLoadingSuggestion] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { showToast } = useToast()

  const compatibleChores = useMemo(
    () => availableChores.filter((chore) => COMPATIBILITY[slotType].includes(chore.frequency)),
    [availableChores, slotType]
  )

  const loadSuggestion = async () => {
    setLoadingSuggestion(true)
    setError('')

    try {
      const response = await fetch('/api/schedules/suggest', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ slotType }),
      })

      const payload = (await response.json()) as SuggestionPayload
      if (!response.ok || !payload.data) {
        setSuggestedChore(null)
        setError(payload.error || 'No suggestion available for this slot')
        showToast(payload.error || 'No suggestion available for this slot', 'error')
        return
      }

      setSuggestedChore({
        id: payload.data.chore.id,
        title: payload.data.chore.title,
        lastCompletedAt: payload.data.lastCompletedAt,
      })
      setManualChoreId(payload.data.chore.id)
    } catch {
      setError('Could not load suggestion')
      setSuggestedChore(null)
      showToast('Could not load suggestion', 'error')
    } finally {
      setLoadingSuggestion(false)
    }
  }

  useEffect(() => {
    void loadSuggestion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotType])

  const createSlot = async () => {
    setError('')

    if (!scheduledFor) {
      setError('Please choose a date and time')
      return
    }

    if (manualMode && !manualChoreId) {
      setError('Select a chore for manual mode')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          scheduledFor: new Date(scheduledFor).toISOString(),
          slotType,
          ...(manualMode ? { choreId: manualChoreId, suggested: false } : {}),
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        setError(payload.error || 'Failed to create slot')
        showToast(payload.error || 'Failed to create slot', 'error')
        return
      }

      onScheduleCreated(payload.data as ScheduleWithChore)
      showToast('Slot created')
    } catch {
      setError('Failed to create slot')
      showToast('Failed to create slot', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-5 rounded-[var(--radius-xl)] border border-[var(--border-soft)] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1 space-y-2">
          <label htmlFor="slot-type" className="text-sm font-medium text-[var(--color-charcoal)]">
            Slot Type
          </label>
          <select
            id="slot-type"
            className="min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-soft)] bg-white px-3.5 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:border-[var(--color-terracotta)] focus-visible:shadow-[var(--shadow-focus)] sm:min-h-12"
            value={slotType}
            onChange={(event) => setSlotType(event.target.value as Frequency)}
          >
            {SLOT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 space-y-2">
          <label htmlFor="scheduled-for" className="text-sm font-medium text-[var(--color-charcoal)]">
            Scheduled For
          </label>
          <input
            id="scheduled-for"
            type="datetime-local"
            className="min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-soft)] px-3.5 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:border-[var(--color-terracotta)] focus-visible:shadow-[var(--shadow-focus)] sm:min-h-12"
            value={scheduledFor}
            onChange={(event) => setScheduledFor(event.target.value)}
          />
        </div>
      </div>

      <div className="flex min-h-11 items-center gap-2.5 rounded-[var(--radius-sm)] bg-[var(--color-cream)]/45 px-3">
        <input
          id="manual-mode"
          type="checkbox"
          className="h-5 w-5 rounded border-[var(--border-soft)]"
          checked={manualMode}
          onChange={(event) => setManualMode(event.target.checked)}
        />
        <label htmlFor="manual-mode" className="text-sm text-[var(--color-charcoal)]">
          Manual override
        </label>
      </div>

      {manualMode ? (
        <div className="space-y-2">
          <label htmlFor="manual-chore" className="text-sm font-medium text-[var(--color-charcoal)]">
            Choose chore
          </label>
          <select
            id="manual-chore"
            className="min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-soft)] bg-white px-3.5 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:border-[var(--color-terracotta)] focus-visible:shadow-[var(--shadow-focus)] sm:min-h-12"
            value={manualChoreId}
            onChange={(event) => setManualChoreId(event.target.value)}
          >
            <option value="">Select a chore</option>
            {compatibleChores.map((chore) => (
              <option key={chore.id} value={chore.id}>
                {chore.title} ({chore.frequency})
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-charcoal)]/10 bg-[var(--color-cream)]/55 p-4 text-sm">
          <p className="font-medium text-[var(--color-charcoal)]">Suggested chore</p>
          <p className="mt-1 leading-relaxed text-[var(--color-charcoal)]/82">
            {loadingSuggestion
              ? 'Loading suggestion...'
              : suggestedChore
                ? `${suggestedChore.title}${
                  suggestedChore.lastCompletedAt
                    ? ` (last done ${new Date(suggestedChore.lastCompletedAt).toLocaleDateString('en-US')})`
                    : ' (never completed)'
                }`
                : 'No suggestion available'}
          </p>
          <Button type="button" variant="tertiary" size="sm" className="mt-3 justify-center" onClick={() => void loadSuggestion()}>
            Refresh Suggestion
          </Button>
        </div>
      )}

      {error ? (
        <p className="text-sm text-red-700">{error}</p>
      ) : null}

      <Button type="button" onClick={() => void createSlot()} disabled={isSubmitting} className="w-full justify-center sm:w-auto">
        {isSubmitting ? 'Creating Slot...' : 'Create Slot'}
      </Button>
    </div>
  )
}
