import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import purchaseHistoryData from '@/data/mock/purchase_history.json'
import adMetricsData from '@/data/mock/ad_metrics.json'
import snsMetricsData from '@/data/mock/sns_metrics.json'
import kpiTargetsData from '@/data/mock/kpi_targets.json'

export async function POST() {
  try {
    // まずマイグレーションを確認
    const count = await prisma.purchaseHistory.count()
    if (count > 0) {
      return NextResponse.json({
        message: 'Already seeded',
        count
      })
    }

    await prisma.purchaseHistory.createMany({
      data: purchaseHistoryData as never[]
    })
    await prisma.adMetrics.createMany({
      data: adMetricsData as never[]
    })
    await prisma.snsMetrics.createMany({
      data: snsMetricsData as never[]
    })
    await prisma.kpiTarget.createMany({
      data: kpiTargetsData as never[]
    })

    return NextResponse.json({
      message: 'Seeded successfully',
      counts: {
        purchases: purchaseHistoryData.length,
        ads: adMetricsData.length,
        sns: snsMetricsData.length,
        kpiTargets: kpiTargetsData.length,
      }
    })
  } catch (err) {
    console.error('[POST /api/seed]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
