import * as React from 'react'
import { cn } from '@/lib/utils'
import type { Frequency } from '@/types/frequency'

export interface FrequencyBadgeProps {
  frequency: Frequency
  className?: string
}

const frequencyStyles: Record<Frequency, string> = {
  DAILY:
    'bg-[var(--color-terracotta)]/15 text-[var(--color-terracotta)] border-[var(--color-terracotta)]/30',
  WEEKLY:
    'bg-[var(--color-sage)]/15 text-[var(--color-sage)] border-[var(--color-sage)]/30',
  MONTHLY:
    'bg-[var(--color-charcoal)]/10 text-[var(--color-charcoal)] border-[var(--color-charcoal)]/20',
  YEARLY:
    'bg-[var(--color-cream)] text-[var(--color-charcoal)] border-[var(--color-charcoal)]/20',
}

export function FrequencyBadge({ frequency, className }: FrequencyBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        'font-[var(--font-display)] uppercase tracking-wide border',
        frequencyStyles[frequency],
        className
      )}
    >
      {frequency}
    </span>
  )
}
