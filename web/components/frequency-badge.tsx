import { Frequency } from '@prisma/client'
import { cn } from '@/lib/utils'

interface FrequencyBadgeProps {
  frequency: Frequency
  className?: string
}

const FREQUENCY_STYLES: Record<Frequency, string> = {
  DAILY: 'bg-[var(--color-terracotta)]/15 text-[var(--color-terracotta)] border-[var(--color-terracotta)]/30',
  WEEKLY: 'bg-[var(--color-sage)]/20 text-[var(--color-charcoal)] border-[var(--color-sage)]/40',
  MONTHLY: 'bg-[var(--color-charcoal)]/10 text-[var(--color-charcoal)] border-[var(--color-charcoal)]/20',
  YEARLY: 'bg-[var(--color-cream)] text-[var(--color-charcoal)] border-[var(--color-charcoal)]/20',
}

export function FrequencyBadge({ frequency, className }: FrequencyBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex min-h-6 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide',
        FREQUENCY_STYLES[frequency],
        className
      )}
    >
      {frequency}
    </span>
  )
}
