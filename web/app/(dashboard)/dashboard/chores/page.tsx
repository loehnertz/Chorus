import { requireApprovedUser } from '@/lib/auth/require-approval'
import { db } from '@/lib/db'
import dynamicImport from 'next/dynamic'

const ChorePoolManager = dynamicImport(
  () => import('@/components/chore-pool-manager').then((module) => module.ChorePoolManager),
  {
    loading: () => <p className="text-sm text-[var(--color-charcoal)]/70">Loading chore manager...</p>,
  }
)

export default async function ChoresPage() {
  await requireApprovedUser()

  const users = await db.user.findMany({
    where: {
      approved: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      id: true,
      name: true,
      image: true,
    },
  })

  return <ChorePoolManager users={users} />
}

export const dynamic = 'force-dynamic'
