export default function ScheduleLoading() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-56 animate-pulse rounded bg-[var(--color-charcoal)]/10" />
      <div className="h-60 animate-pulse rounded-[var(--radius-lg)] bg-white" />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-[var(--radius-lg)] bg-white" />
        ))}
      </div>
    </div>
  )
}
