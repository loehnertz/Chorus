import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Skeleton className="h-24 rounded-[var(--radius-md)]" />
        <Skeleton className="h-24 rounded-[var(--radius-md)]" />
        <Skeleton className="h-24 rounded-[var(--radius-md)]" />
        <Skeleton className="h-24 rounded-[var(--radius-md)]" />
      </div>

      <SkeletonCard />
      <SkeletonCard />
    </div>
  )
}
