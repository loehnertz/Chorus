export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-56 animate-pulse rounded bg-[var(--color-charcoal)]/10" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-[var(--radius-lg)] bg-white" />
        ))}
      </div>
      <div className="h-56 animate-pulse rounded-[var(--radius-lg)] bg-white" />
    </div>
  )
}
