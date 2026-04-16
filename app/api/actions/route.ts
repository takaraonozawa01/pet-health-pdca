import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const product = searchParams.get('product')

  try {
    const actions = await prisma.action.findMany({
      where: product ? { product } : undefined,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(actions)
  } catch (err) {
    console.error('[GET /api/actions]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { source, product, title, description, priority, status, relatedKpi, dueDate } = body

    if (!source || !product || !title || !description || !priority || !relatedKpi) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const action = await prisma.action.create({
      data: {
        source,
        product,
        title,
        description,
        priority,
        status: status ?? 'proposed',
        relatedKpi,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    })

    return NextResponse.json(action, { status: 201 })
  } catch (err) {
    console.error('[POST /api/actions]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
