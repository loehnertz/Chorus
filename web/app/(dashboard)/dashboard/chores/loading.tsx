export default function ChoresLoading() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-48 animate-pulse rounded bg-[var(--color-charcoal)]/10" />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-44 animate-pulse rounded-[var(--radius-lg)] bg-white" />
        ))}
      </div>
    </div>
  )
}
