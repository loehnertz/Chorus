/** @jest-environment node */

import { GET, POST } from '../route'
import { db } from '@/lib/db'
import { requireApprovedUser } from '@/lib/auth/require-approval'

jest.mock('@/lib/auth/require-approval', () => ({
  requireApprovedUser: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
  db: {
    chore: {
      findUnique: jest.fn(),
    },
    schedule: {
      findUnique: jest.fn(),
    },
    choreCompletion: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

type MockDb = {
  chore: {
    findUnique: jest.Mock
  }
  schedule: {
    findUnique: jest.Mock
  }
  choreCompletion: {
    findMany: jest.Mock
    create: jest.Mock
  }
}

const mockDb = db as unknown as MockDb
const mockRequireApprovedUser = requireApprovedUser as jest.Mock

describe('/api/completions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireApprovedUser.mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('GET validates date filters', async () => {
    const response = await GET(new Request('http://localhost/api/completions?from=not-a-date'))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('Invalid from date')
  })

  it('GET returns filtered completions', async () => {
    mockDb.choreCompletion.findMany.mockResolvedValue([
      {
        id: 'completion-1',
        choreId: 'chore-1',
        scheduleId: null,
        userId: 'user-1',
        notes: null,
        completedAt: new Date('2025-01-01T00:00:00.000Z'),
        chore: { id: 'chore-1', title: 'Dishes' },
        user: { id: 'user-1', name: 'Alex', image: null },
        schedule: null,
      },
    ])

    const response = await GET(new Request('http://localhost/api/completions?limit=10&userId=user-1'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data).toHaveLength(1)
    expect(mockDb.choreCompletion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1' }),
        take: 10,
      })
    )
  })

  it('POST validates choreId', async () => {
    const response = await POST(
      new Request('http://localhost/api/completions', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'content-type': 'application/json' },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('choreId is required')
  })

  it('POST returns 404 for unknown chore', async () => {
    mockDb.chore.findUnique.mockResolvedValue(null)

    const response = await POST(
      new Request('http://localhost/api/completions', {
        method: 'POST',
        body: JSON.stringify({ choreId: 'missing' }),
        headers: { 'content-type': 'application/json' },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error).toContain('Chore not found')
  })

  it('POST validates schedule/chore relationship', async () => {
    mockDb.chore.findUnique.mockResolvedValue({ id: 'chore-1' })
    mockDb.schedule.findUnique.mockResolvedValue({ id: 'schedule-1', choreId: 'other-chore' })

    const response = await POST(
      new Request('http://localhost/api/completions', {
        method: 'POST',
        body: JSON.stringify({ choreId: 'chore-1', scheduleId: 'schedule-1' }),
        headers: { 'content-type': 'application/json' },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('does not belong')
  })

  it('POST creates completion', async () => {
    mockDb.chore.findUnique.mockResolvedValue({ id: 'chore-1' })
    mockDb.choreCompletion.create.mockResolvedValue({
      id: 'completion-1',
      choreId: 'chore-1',
      scheduleId: null,
      userId: 'user-1',
      notes: 'Done',
      completedAt: new Date('2025-01-01T00:00:00.000Z'),
      chore: { id: 'chore-1', title: 'Dishes' },
      user: { id: 'user-1', name: 'Alex', image: null },
      schedule: null,
    })

    const response = await POST(
      new Request('http://localhost/api/completions', {
        method: 'POST',
        body: JSON.stringify({ choreId: 'chore-1', notes: 'Done' }),
        headers: { 'content-type': 'application/json' },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.data.id).toBe('completion-1')
    expect(mockDb.choreCompletion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          choreId: 'chore-1',
          userId: 'user-1',
        }),
      })
    )
  })
})
