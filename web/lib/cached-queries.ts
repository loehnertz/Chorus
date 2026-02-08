import { unstable_cache } from 'next/cache'

import { db } from '@/lib/db'

export const CACHE_TAGS = {
  chores: 'chores',
  approvedUsers: 'approved-users',
} as const

export const getApprovedUsersCached = unstable_cache(
  async () => {
    return db.user.findMany({
      where: { approved: true },
      select: { id: true, name: true, image: true },
      orderBy: { createdAt: 'asc' },
    })
  },
  ['approved-users-v1'],
  { revalidate: 60, tags: [CACHE_TAGS.approvedUsers] },
)

export const getChoresForScheduleCached = unstable_cache(
  async () => {
    return db.chore.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        frequency: true,
        assignments: { select: { userId: true }, orderBy: [{ createdAt: 'asc' }, { userId: 'asc' }] },
      },
      orderBy: { title: 'asc' },
    })
  },
  ['schedule-chores-v1'],
  { revalidate: 60, tags: [CACHE_TAGS.chores] },
)
