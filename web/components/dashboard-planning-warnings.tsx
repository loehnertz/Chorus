import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { FREQUENCY_LABELS } from '@/types/frequency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DashboardPlanningWarning } from '@/lib/dashboard-planning-warnings'

export interface DashboardPlanningWarningsProps {
  warnings: DashboardPlanningWarning[]
  className?: string
}

function formatPercent(value: number) {
  const pct = Math.round(value * 100)
  return `${pct}%`
}

function formatChoreList(chores: Array<{ title: string }>, max = 8) {
  const shown = chores.slice(0, max).map((c) => c.title)
  const extra = chores.length - shown.length
  if (extra > 0) return `${shown.join(', ')}, and ${extra} more`
  return shown.join(', ')
}

export function DashboardPlanningWarnings({ warnings, className }: DashboardPlanningWarningsProps) {
  if (!warnings.length) return null

  return (
    <Card className={cn(className)}>
      <CardHeader className="space-y-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <CardTitle className="text-xl md:text-2xl">Planning warnings</CardTitle>
          <p className="mt-1 text-sm text-[var(--foreground)]/70">
            Some cycles are nearly over, with chores still unscheduled.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="default"
          className="w-full sm:w-auto sm:h-9 sm:px-4 sm:py-2 sm:text-sm"
        >
          <Link href="/schedule" prefetch={false}>
            Open schedule
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {warnings.map((w) => (
            <div
              key={w.frequency}
              className={cn(
                'flex gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] p-3',
                'border-l-4 border-l-[var(--color-terracotta)]'
              )}
            >
              <AlertTriangle
                className="mt-0.5 h-4 w-4 text-[var(--color-terracotta)]"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-sm font-[var(--font-display)] font-medium text-[var(--foreground)]">
                  {FREQUENCY_LABELS[w.frequency]} cycle: {formatPercent(w.remainingFraction)} remaining
                </p>
                <p className="mt-0.5 text-xs text-[var(--foreground)]/60">
                  Unscheduled ({w.unscheduledChores.length}): {formatChoreList(w.unscheduledChores)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
