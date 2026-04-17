import { NextRequest, NextResponse } from 'next/server'
import { getKpiData } from '@/lib/kpi'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const product = searchParams.get('product') ?? 'tierra'
  const days = parseInt(searchParams.get('days') ?? '60', 10)

  try {
    const data = await getKpiData(product, days)
    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/kpi]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
