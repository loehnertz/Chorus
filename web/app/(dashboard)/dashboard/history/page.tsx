import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireApprovedUser } from '@/lib/auth/require-approval'
import { db } from '@/lib/db'

export default async function CompletionHistoryPage() {
  await requireApprovedUser()

  const completions = await db.choreCompletion.findMany({
    orderBy: {
      completedAt: 'desc',
    },
    take: 100,
    include: {
      chore: {
        select: {
          id: true,
          title: true,
          frequency: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      schedule: {
        select: {
          id: true,
          slotType: true,
          suggested: true,
        },
      },
    },
  })

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold text-[var(--color-charcoal)]">Completion History</h1>
      {completions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">No completions yet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-[var(--color-charcoal)]/70">
            Completed chores will appear here.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {completions.map((completion) => (
            <Card key={completion.id} className="p-4">
              <CardContent className="space-y-2 p-0 text-sm">
                <p className="font-medium text-[var(--color-charcoal)]">{completion.chore.title}</p>
                <p className="text-[var(--color-charcoal)]/70">
                  Completed by {completion.user.name || 'Unknown'} on{' '}
                  {completion.completedAt.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-xs text-[var(--color-charcoal)]/60">
                  Frequency: {completion.chore.frequency}
                  {completion.schedule ? ` | Slot: ${completion.schedule.slotType}` : ''}
                  {completion.schedule?.suggested ? ' (suggested)' : ''}
                </p>
                {completion.notes ? (
                  <p className="rounded-[var(--radius-sm)] bg-[var(--color-cream)] px-2 py-1 text-xs text-[var(--color-charcoal)]/75">
                    {completion.notes}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export const dynamic = 'force-dynamic'
