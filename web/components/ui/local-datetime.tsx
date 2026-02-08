'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { formatLocalDateTimeCompact } from '@/lib/format-local-datetime'

export interface LocalDateTimeProps {
  iso: string
  className?: string
}

export function LocalDateTime({ iso, className }: LocalDateTimeProps) {
  const [label, setLabel] = React.useState('--')

  React.useEffect(() => {
    setLabel(formatLocalDateTimeCompact(iso) ?? '')
  }, [iso])

  return (
    <span className={cn('tabular-nums', className)} suppressHydrationWarning>
      {label}
    </span>
  )
}
