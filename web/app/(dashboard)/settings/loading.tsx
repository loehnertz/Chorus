import { SkeletonCard, SkeletonText } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-7 md:space-y-8">
      <div className="space-y-2">
        <SkeletonText className="h-7 w-32" />
        <SkeletonText className="h-4 w-64" />
      </div>

      <SkeletonCard />
      <SkeletonCard />
    </div>
  )
}
