import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import * as fs from 'fs'
import * as path from 'path'

export async function POST() {
  try {
    const mockDir = path.join(process.cwd(), 'data', 'mock')

    // Delete in order (no FK constraints in SQLite, but be safe)
    await prisma.purchaseHistory.deleteMany()
    await prisma.adMetrics.deleteMany()
    await prisma.snsMetrics.deleteMany()

    // Re-seed PurchaseHistory
    const purchaseData: Array<{
      purchasedAt: string; shop: string; product: string; customerId: string
      orderId: string; revenue: number; quantity: number; isSubscription: boolean
      utmSource?: string; utmMedium?: string; utmCampaign?: string
    }> = JSON.parse(fs.readFileSync(path.join(mockDir, 'purchase_history.json'), 'utf-8'))

    for (const row of purchaseData) {
      await prisma.purchaseHistory.create({
        data: {
          purchasedAt: new Date(row.purchasedAt),
          shop: row.shop,
          product: row.product,
          customerId: row.customerId,
          orderId: row.orderId,
          revenue: row.revenue,
          quantity: row.quantity,
          isSubscription: row.isSubscription,
          utmSource: row.utmSource ?? null,
          utmMedium: row.utmMedium ?? null,
          utmCampaign: row.utmCampaign ?? null,
        },
      })
    }

    // Re-seed AdMetrics
    const adData: Array<{
      date: string; channel: string; product: string; spend: number
      impressions: number; clicks: number; ctr: number
      conversions: number; cpa: number; roas: number
    }> = JSON.parse(fs.readFileSync(path.join(mockDir, 'ad_metrics.json'), 'utf-8'))

    await prisma.adMetrics.createMany({
      data: adData.map((row) => ({
        date: new Date(row.date),
        channel: row.channel,
        product: row.product,
        spend: row.spend,
        impressions: row.impressions,
        clicks: row.clicks,
        ctr: row.ctr,
        conversions: row.conversions,
        cpa: row.cpa,
        roas: row.roas,
      })),
    })

    // Re-seed SnsMetrics
    const snsData: Array<{
      weekStart: string; channel: string; product: string; reach: number
      saves: number; followersDelta: number; engagementRate: number
    }> = JSON.parse(fs.readFileSync(path.join(mockDir, 'sns_metrics.json'), 'utf-8'))

    await prisma.snsMetrics.createMany({
      data: snsData.map((row) => ({
        weekStart: new Date(row.weekStart),
        channel: row.channel,
        product: row.product,
        reach: row.reach,
        saves: row.saves,
        followersDelta: row.followersDelta,
        engagementRate: row.engagementRate,
      })),
    })

    return NextResponse.json({
      success: true,
      message: `リセット完了 — 購入履歴 ${purchaseData.length} 件に戻しました`,
    })
  } catch (err) {
    console.error('[POST /api/import/reset]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
