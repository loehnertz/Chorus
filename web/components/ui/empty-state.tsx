import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  ctaLabel?: string
  onCtaClick?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  ctaLabel,
  onCtaClick,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center py-16 text-center', className)}
    >
      <Icon
        className="h-12 w-12 text-[var(--foreground)]/30"
        aria-hidden="true"
      />
      <h3 className="mt-5 text-lg font-[var(--font-display)] font-medium text-[var(--foreground)]/70">
        {title}
      </h3>
      {subtitle ? (
        <p className="mt-2 max-w-xs text-sm text-[var(--foreground)]/50">{subtitle}</p>
      ) : null}
      {ctaLabel && onCtaClick ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={onCtaClick}>
          {ctaLabel}
        </Button>
      ) : null}
    </div>
  )
}
