import { db } from '@/lib/db'
import { withApproval } from '@/lib/auth/with-approval'

export const runtime = 'nodejs'

export const DELETE = withApproval(async (
  session,
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params

    const existing = await db.holiday.findUnique({ where: { id } })

    if (!existing) {
      return Response.json({ error: 'Holiday not found' }, { status: 404 })
    }

    if (existing.userId !== session.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.holiday.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete holiday:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
})
