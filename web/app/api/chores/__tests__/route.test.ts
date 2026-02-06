/** @jest-environment node */

import { Prisma } from '@prisma/client'
import { GET, POST } from '../route'
import { db } from '@/lib/db'
import { requireApprovedUser } from '@/lib/auth/require-approval'

jest.mock('@/lib/auth/require-approval', () => ({
  requireApprovedUser: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
  db: {
    chore: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

type MockDb = {
  chore: {
    findMany: jest.Mock
    create: jest.Mock
  }
}

const mockDb = db as unknown as MockDb
const mockRequireApprovedUser = requireApprovedUser as jest.Mock

describe('/api/chores', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireApprovedUser.mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('GET returns chores', async () => {
    mockDb.chore.findMany.mockResolvedValue([
      {
        id: 'chore-1',
        title: 'Dishes',
        description: null,
        frequency: 'DAILY',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
        assignments: [],
        _count: { completions: 1, schedules: 0 },
      },
    ])

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data).toHaveLength(1)
    expect(mockRequireApprovedUser).toHaveBeenCalledTimes(1)
    expect(mockDb.chore.findMany).toHaveBeenCalledTimes(1)
  })

  it('POST validates required title', async () => {
    const request = new Request('http://localhost/api/chores', {
      method: 'POST',
      body: JSON.stringify({ frequency: 'DAILY' }),
      headers: { 'content-type': 'application/json' },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('Title is required')
    expect(mockDb.chore.create).not.toHaveBeenCalled()
  })

  it('POST validates frequency', async () => {
    const request = new Request('http://localhost/api/chores', {
      method: 'POST',
      body: JSON.stringify({ title: 'Laundry', frequency: 'HOURLY' }),
      headers: { 'content-type': 'application/json' },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('Frequency must be')
    expect(mockDb.chore.create).not.toHaveBeenCalled()
  })

  it('POST creates chore', async () => {
    const createdChore = {
      id: 'chore-2',
      title: 'Vacuum',
      description: 'Living room',
      frequency: 'WEEKLY',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      assignments: [
        {
          id: 'a-1',
          userId: 'user-1',
          choreId: 'chore-2',
          createdAt: new Date('2025-01-01T00:00:00.000Z'),
          user: {
            id: 'user-1',
            name: 'Alex',
            image: null,
          },
        },
      ],
      _count: {
        completions: 0,
        schedules: 0,
      },
    }

    mockDb.chore.create.mockResolvedValue(createdChore)

    const request = new Request('http://localhost/api/chores', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Vacuum',
        description: 'Living room',
        frequency: 'WEEKLY',
        assignedUserIds: ['user-1', 'user-1'],
      }),
      headers: { 'content-type': 'application/json' },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.data.id).toBe('chore-2')
    expect(mockDb.chore.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Vacuum',
          frequency: 'WEEKLY',
          assignments: {
            create: [{ userId: 'user-1' }],
          },
        }),
      })
    )
  })

  it('POST handles invalid assignment user references', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('invalid relation', {
      code: 'P2003',
      clientVersion: '7.3.0',
    })

    mockDb.chore.create.mockRejectedValue(prismaError)

    const request = new Request('http://localhost/api/chores', {
      method: 'POST',
      body: JSON.stringify({ title: 'Vacuum', frequency: 'WEEKLY', assignedUserIds: ['unknown-user'] }),
      headers: { 'content-type': 'application/json' },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('assigned user IDs do not exist')
  })
})
