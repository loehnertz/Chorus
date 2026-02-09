'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Palmtree, Trash2, Plus, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

type Holiday = {
  id: string
  startDate: string
  endDate: string
  label: string | null
  createdAt: string
}

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { when: 'beforeChildren', staggerChildren: 0.05 },
  },
}

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

function formatDateRange(startIso: string, endIso: string) {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const fmt = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
  if (start.toISOString().slice(0, 10) === end.toISOString().slice(0, 10)) {
    return fmt.format(start)
  }
  return `${fmt.format(start)} – ${fmt.format(end)}`
}

function isActiveHoliday(h: Holiday) {
  const today = new Date().toISOString().slice(0, 10)
  return h.startDate.slice(0, 10) <= today && h.endDate.slice(0, 10) >= today
}

function isPastHoliday(h: Holiday) {
  const today = new Date().toISOString().slice(0, 10)
  return h.endDate.slice(0, 10) < today
}

export interface HolidayManagerProps {
  className?: string
}

export function HolidayManager({ className }: HolidayManagerProps) {
  const [holidays, setHolidays] = React.useState<Holiday[]>([])
  const [loading, setLoading] = React.useState(true)
  const [busy, setBusy] = React.useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null)

  const [startDate, setStartDate] = React.useState('')
  const [endDate, setEndDate] = React.useState('')
  const [label, setLabel] = React.useState('')

  React.useEffect(() => {
    fetch('/api/holidays')
      .then(async (r) => {
        if (!r.ok) return
        const data = (await r.json()) as Holiday[]
        setHolidays(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const createHoliday = async () => {
    if (busy || !startDate || !endDate) return
    setBusy(true)
    try {
      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate, label }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        const msg =
          (data as { error?: string } | null)?.error ?? 'Failed to create holiday'
        toast.error(msg)
        return
      }
      const created = (await res.json()) as Holiday
      setHolidays((prev) => [created, ...prev])
      setStartDate('')
      setEndDate('')
      setLabel('')
      toast.success('Holiday added')
    } catch {
      toast.error('Failed to create holiday')
    } finally {
      setBusy(false)
    }
  }

  const deleteHoliday = async (id: string) => {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch(`/api/holidays/${id}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) {
        toast.error('Failed to delete holiday')
        return
      }
      setHolidays((prev) => prev.filter((h) => h.id !== id))
      toast.success('Holiday removed')
    } catch {
      toast.error('Failed to delete holiday')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
            <Palmtree className="h-5 w-5 text-[var(--color-sage)]" aria-hidden="true" />
            Holiday Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 text-sm text-[var(--foreground)]/70">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-sage)]" aria-hidden="true" />
            <p>Pause chores during holidays. Streaks are preserved and reminders are silenced.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <label htmlFor="holiday-start" className="text-xs font-[var(--font-display)] text-[var(--foreground)]/60">
                From
              </label>
              <Input
                id="holiday-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="flex-1 space-y-1">
              <label htmlFor="holiday-end" className="text-xs font-[var(--font-display)] text-[var(--foreground)]/60">
                To
              </label>
              <Input
                id="holiday-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="flex-1 space-y-1">
              <label htmlFor="holiday-label" className="text-xs font-[var(--font-display)] text-[var(--foreground)]/60">
                Label (optional)
              </label>
              <Input
                id="holiday-label"
                type="text"
                placeholder="e.g. Summer vacation"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                disabled={busy}
              />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={createHoliday}
              disabled={busy || !startDate || !endDate}
              className="gap-1.5 shrink-0"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-[var(--foreground)]/50">Loading...</p>
          ) : holidays.length === 0 ? (
            <p className="text-sm text-[var(--foreground)]/50">No holidays planned.</p>
          ) : (
            <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-2">
              {holidays.map((h) => {
                const active = isActiveHoliday(h)
                const past = isPastHoliday(h)
                return (
                  <motion.div
                    key={h.id}
                    variants={rowVariants}
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-[var(--radius-md)] border px-3 py-2',
                      active
                        ? 'border-[var(--color-sage)]/30 bg-[var(--color-sage)]/10'
                        : 'border-[var(--border)] bg-[var(--surface)]',
                      past && 'opacity-50',
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-[var(--font-display)] text-[var(--foreground)]">
                        {formatDateRange(h.startDate, h.endDate)}
                        {active && (
                          <span className="ml-2 text-xs font-normal text-[var(--color-sage)]">Active</span>
                        )}
                      </p>
                      {h.label && (
                        <p className="mt-0.5 truncate text-xs text-[var(--foreground)]/60">{h.label}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(h.id)}
                      disabled={busy}
                      className={cn(
                        'inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)]',
                        'text-red-600 hover:bg-red-600/10',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-terracotta)] focus-visible:ring-offset-2',
                      )}
                      aria-label="Delete holiday"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => setConfirmDeleteId(open ? confirmDeleteId : null)}
        title="Delete holiday?"
        description="This holiday period will be removed. Streaks will no longer bridge these days."
        confirmLabel="Delete"
        destructive
        confirmDisabled={!confirmDeleteId || busy}
        onConfirm={async () => {
          if (!confirmDeleteId) return
          await deleteHoliday(confirmDeleteId)
        }}
      />
    </>
  )
}
