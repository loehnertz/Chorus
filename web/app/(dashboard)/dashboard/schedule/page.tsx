import { requireApprovedUser } from '@/lib/auth/require-approval'
import { db } from '@/lib/db'
import dynamicImport from 'next/dynamic'

const ScheduleWorkspace = dynamicImport(
  () => import('@/components/schedule-workspace').then((module) => module.ScheduleWorkspace),
  {
    loading: () => <p className="text-sm text-[var(--color-charcoal)]/70">Loading schedule workspace...</p>,
  }
)

export default async function SchedulePage() {
  await requireApprovedUser()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [schedules, chores] = await Promise.all([
    db.schedule.findMany({
      where: {
        scheduledFor: {
          gte: today,
        },
      },
      orderBy: {
        scheduledFor: 'asc',
      },
      include: {
        chore: {
          include: {
            assignments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
              },
            },
            _count: {
              select: {
                completions: true,
                schedules: true,
              },
            },
          },
        },
      },
    }),
    db.chore.findMany({
      orderBy: [{ frequency: 'asc' }, { title: 'asc' }],
      select: {
        id: true,
        title: true,
        frequency: true,
      },
    }),
  ])

  return <ScheduleWorkspace initialSchedules={schedules} availableChores={chores} />
}

export const dynamic = 'force-dynamic'
