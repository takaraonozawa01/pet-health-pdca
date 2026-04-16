import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const totalPurchases = await prisma.purchaseHistory.count()

    const latest = await prisma.purchaseHistory.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    })

    const isMockData = totalPurchases <= 600

    return NextResponse.json({
      totalPurchases,
      lastImportedAt: latest?.createdAt?.toISOString() ?? null,
      isMockData,
    })
  } catch (err) {
    console.error('[GET /api/import/stats]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
