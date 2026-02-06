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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-4">
          <CardHeader className="mb-2 p-0">
            <CardTitle className="text-sm font-medium text-[var(--color-charcoal)]/70">{stat.label}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-3xl font-semibold text-[var(--color-charcoal)]">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
