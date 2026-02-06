import { ChorePoolManager } from '@/components/chore-pool-manager'
import { requireApprovedUser } from '@/lib/auth/require-approval'
import { db } from '@/lib/db'

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
