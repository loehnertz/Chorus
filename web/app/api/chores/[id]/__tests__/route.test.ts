/** @jest-environment node */

import { Prisma } from '@prisma/client'
import { DELETE, GET, PUT } from '../route'
import { db } from '@/lib/db'
import { requireApprovedUser } from '@/lib/auth/require-approval'

jest.mock('@/lib/auth/require-approval', () => ({
  requireApprovedUser: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
  db: {
    chore: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

type MockDb = {
  chore: {
    findUnique: jest.Mock
    update: jest.Mock
    delete: jest.Mock
  }
}

const mockDb = db as unknown as MockDb
const mockRequireApprovedUser = requireApprovedUser as jest.Mock

describe('/api/chores/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireApprovedUser.mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('GET returns a chore', async () => {
    mockDb.chore.findUnique.mockResolvedValue({ id: 'chore-1', title: 'Dishes', assignments: [], _count: { completions: 0, schedules: 0 } })

    const response = await GET(new Request('http://localhost/api/chores/chore-1'), {
      params: Promise.resolve({ id: 'chore-1' }),
    })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.id).toBe('chore-1')
    expect(mockDb.chore.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'chore-1' } }))
  })

  it('GET returns 404 when chore does not exist', async () => {
    mockDb.chore.findUnique.mockResolvedValue(null)

    const response = await GET(new Request('http://localhost/api/chores/chore-missing'), {
      params: Promise.resolve({ id: 'chore-missing' }),
    })
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error).toContain('not found')
  })

  it('PUT validates empty title', async () => {
    const response = await PUT(
      new Request('http://localhost/api/chores/chore-1', {
        method: 'PUT',
        body: JSON.stringify({ title: '   ' }),
        headers: { 'content-type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'chore-1' }) }
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('Title cannot be empty')
  })

  it('PUT updates a chore', async () => {
    mockDb.chore.update.mockResolvedValue({
      id: 'chore-1',
      title: 'Updated title',
      description: null,
      frequency: 'MONTHLY',
      assignments: [],
      _count: { completions: 0, schedules: 0 },
    })

    const response = await PUT(
      new Request('http://localhost/api/chores/chore-1', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated title', frequency: 'MONTHLY', assignedUserIds: ['user-2'] }),
        headers: { 'content-type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'chore-1' }) }
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.title).toBe('Updated title')
    expect(mockDb.chore.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'chore-1' },
        data: expect.objectContaining({
          title: 'Updated title',
          frequency: 'MONTHLY',
          assignments: {
            deleteMany: {},
            create: [{ userId: 'user-2' }],
          },
        }),
      })
    )
  })

  it('DELETE removes a chore', async () => {
    mockDb.chore.delete.mockResolvedValue({ id: 'chore-1' })

    const response = await DELETE(new Request('http://localhost/api/chores/chore-1', { method: 'DELETE' }), {
      params: Promise.resolve({ id: 'chore-1' }),
    })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('DELETE returns 404 when chore is missing', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: '7.3.0',
    })
    mockDb.chore.delete.mockRejectedValue(prismaError)

    const response = await DELETE(new Request('http://localhost/api/chores/chore-missing', { method: 'DELETE' }), {
      params: Promise.resolve({ id: 'chore-missing' }),
    })
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error).toContain('not found')
  })
})
