import { CalendarDays } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-[var(--font-display)] font-bold text-[var(--foreground)]">
          Schedule
        </h1>
        <p className="mt-1 text-sm text-[var(--foreground)]/70">
          Calendar and slot planning arrives in Phase 6.
        </p>
      </div>

      <EmptyState
        icon={CalendarDays}
        title="Scheduling is coming soon"
        subtitle="You will be able to plan slots and accept cascade suggestions in Phase 6."
      />
    </div>
  )
}
