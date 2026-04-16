import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface MappedRow {
  orderId: string
  purchasedAt: string
  customerId: string
  product: string
  revenue: number
  quantity: number
  isSubscription: boolean
}

function detectProduct(productName: string): string {
  const n = productName.toLowerCase()
  if (n.includes('tierra') || n.includes('ティエラ')) return 'TIERRA'
  if (n.includes('nmn')) return 'NMN'
  if (n.includes('水素')) return 'SUISO'
  return 'OTHER'
}

export async function POST(req: NextRequest) {
  try {
    const { shop, rows }: { shop: string; rows: MappedRow[] } = await req.json()

    if (!shop || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Missing shop or rows' }, { status: 400 })
    }

    const data = rows.map((row) => ({
      orderId: String(row.orderId),
      purchasedAt: new Date(row.purchasedAt),
      customerId: String(row.customerId),
      product: detectProduct(String(row.product)),
      shop,
      revenue: Number(row.revenue),
      quantity: Number(row.quantity),
      isSubscription: Boolean(row.isSubscription),
    }))

    // Check existing orderIds (skipDuplicates not supported by sqlite adapter)
    const incomingIds = data.map((r) => r.orderId)
    const existing = await prisma.purchaseHistory.findMany({
      where: { orderId: { in: incomingIds } },
      select: { orderId: true },
    })
    const existingSet = new Set(existing.map((r) => r.orderId))
    const newRows = data.filter((r) => !existingSet.has(r.orderId))
    const skipped = data.length - newRows.length

    let inserted = 0
    if (newRows.length > 0) {
      const result = await prisma.purchaseHistory.createMany({ data: newRows })
      inserted = result.count
    }

    return NextResponse.json({ inserted, skipped })
  } catch (err) {
    console.error('[POST /api/import/purchase]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
