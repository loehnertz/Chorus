import * as React from 'react'
import { cn } from '@/lib/utils'

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('bg-[var(--surface-2)] rounded-[var(--radius-md)] animate-pulse', className)}
      {...props}
    />
  )
}

export function SkeletonText({ className, ...props }: SkeletonProps) {
  return <Skeleton className={cn('h-4 w-full', className)} {...props} />
}

export function SkeletonCard({ className, ...props }: SkeletonProps) {
  return <Skeleton className={cn('h-40 w-full rounded-[var(--radius-lg)]', className)} {...props} />
}

export function SkeletonCircle({ className, ...props }: SkeletonProps) {
  return <Skeleton className={cn('h-9 w-9 rounded-full', className)} {...props} />
}
