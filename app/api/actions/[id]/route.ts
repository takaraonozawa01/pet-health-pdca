import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const actionId = parseInt(id, 10)
    if (isNaN(actionId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const body = await req.json()
    const { status, effectRating } = body

    const data: Record<string, unknown> = {}
    if (status) data.status = status
    if (effectRating !== undefined) data.effectRating = effectRating
    if (status === 'done') data.completedAt = new Date()

    const action = await prisma.action.update({
      where: { id: actionId },
      data,
    })

    return NextResponse.json(action)
  } catch (err) {
    console.error('[PATCH /api/actions/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
