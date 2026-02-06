import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardStatsProps {
  assignedChores: number
  openToday: number
  completedThisWeek: number
  completedTotal: number
}

export function DashboardStats({
  assignedChores,
  openToday,
  completedThisWeek,
  completedTotal,
}: DashboardStatsProps) {
  const stats = [
    { label: 'Assigned to You', value: assignedChores },
    { label: 'Open Today', value: openToday },
    { label: 'Done This Week', value: completedThisWeek },
    { label: 'Total Completed', value: completedTotal },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:gap-5 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-5 sm:p-6">
          <CardHeader className="mb-1 p-0">
            <CardTitle className="text-sm font-semibold uppercase tracking-[0.06em] text-[var(--color-charcoal)]/65">
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-3xl font-semibold leading-none text-[var(--color-charcoal)] sm:text-[2rem]">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
