import { SkeletonCard } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-[var(--color-cream)] rounded-[var(--radius-md)] animate-pulse" />
          <div className="h-4 w-64 bg-[var(--color-cream)] rounded-[var(--radius-md)] animate-pulse" />
        </div>
        <div className="h-11 w-32 bg-[var(--color-cream)] rounded-[var(--radius-md)] animate-pulse" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}
