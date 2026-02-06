import { requireApprovedUser } from '@/lib/auth/require-approval';
import { db } from '@/lib/db';
import { DashboardOverview } from '@/components/dashboard-overview';

/**
 * Dashboard Page
 * Main dashboard for authenticated and approved users
 */
export default async function DashboardPage() {
  const session = await requireApprovedUser();
  const userId = session.user.id;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);

  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 6);

  const [todayTasks, assignedChores, completedThisWeek, completedTotal] = await Promise.all([
    db.schedule.findMany({
      where: {
        scheduledFor: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      orderBy: { scheduledFor: 'asc' },
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
      where: {
        assignments: {
          some: {
            userId,
          },
        },
      },
      orderBy: [{ frequency: 'asc' }, { title: 'asc' }],
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
    }),
    db.choreCompletion.count({
      where: {
        userId,
        completedAt: {
          gte: weekStart,
        },
      },
    }),
    db.choreCompletion.count({
      where: { userId },
    }),
  ]);

  return (
    <DashboardOverview
      userName={session?.user?.name || 'there'}
      initialTodayTasks={todayTasks}
      initialAssignedChores={assignedChores}
      stats={{
        assignedChores: assignedChores.length,
        openToday: todayTasks.length,
        completedThisWeek,
        completedTotal,
      }}
    />
  );
}

export const dynamic = 'force-dynamic';
