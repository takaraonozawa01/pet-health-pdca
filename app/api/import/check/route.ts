import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { orderIds }: { orderIds: string[] } = await req.json()

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ duplicates: [] })
    }

    const existing = await prisma.purchaseHistory.findMany({
      where: { orderId: { in: orderIds } },
      select: { orderId: true },
    })

    return NextResponse.json({
      duplicates: existing.map((r) => r.orderId),
    })
  } catch (err) {
    console.error('[POST /api/import/check]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
