import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  getRepeatRate,
  getLtv,
  getCohortData,
  getSubscriptionRate,
  getRevenueSummary,
  getRepeatRateAt,
  getSubscriptionRateAt,
  getRevenueSummaryAt,
} from '@/lib/calculations'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const product = searchParams.get('product') ?? 'tierra'
  const days = parseInt(searchParams.get('days') ?? '60', 10)

  const productKey = product.toUpperCase() === 'TIERRA' ? 'TIERRA' : product

  const now = new Date()
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  try {
    // ---- KPI targets ----
    const targets = await prisma.kpiTarget.findMany({ where: { product: productKey } })
    const getTarget = (metricName: string) =>
      targets.find((t) => t.metricName === metricName)

    // ---- Lagging indicators ----
    const prevBaseDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [revenueSummary, repeatRate, subscriptionRate,
           prevRevenue, prevRepeatRate, prevSubscriptionRate] = await Promise.all([
      getRevenueSummary(productKey, days),
      getRepeatRate(productKey, days),
      getSubscriptionRate(productKey),
      getRevenueSummaryAt(productKey, days, prevBaseDate),
      getRepeatRateAt(productKey, days, prevBaseDate),
      getSubscriptionRateAt(productKey, prevBaseDate),
    ])

    // ROAS: average of recent ad metrics (last 4 weeks = 8 rows × 2 channels)
    const recentAds = await prisma.adMetrics.findMany({
      where: { product: productKey },
      orderBy: { date: 'desc' },
      take: 14,
    })
    const avgRoas =
      recentAds.length > 0
        ? recentAds.reduce((s, r) => s + r.roas, 0) / recentAds.length
        : 0

    // prevWeek ROAS: 5〜8週前の平均
    const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000)
    const fiveWeeksAgo  = new Date(now.getTime() - 5 * 7 * 24 * 60 * 60 * 1000)
    const prevAds = await prisma.adMetrics.findMany({
      where: { product: productKey, date: { gte: eightWeeksAgo, lt: fiveWeeksAgo } },
    })
    const prevAvgRoas =
      prevAds.length > 0
        ? prevAds.reduce((s, r) => s + r.roas, 0) / prevAds.length
        : 0

    const roasTarget = getTarget('roas')
    const repeatTarget = getTarget('repeat_rate')
    const subTarget = getTarget('subscription_rate')

    // ---- Leading indicators ----
    const cartTarget = getTarget('cart_add_rate')
    const lineTarget = getTarget('line_open_rate')

    // Latest SNS metrics (Instagram)
    const latestIg = await prisma.snsMetrics.findFirst({
      where: { product: productKey, channel: 'instagram' },
      orderBy: { weekStart: 'desc' },
    })

    // Latest ad metrics by channel
    const [latestGoogle, latestIgAd] = await Promise.all([
      prisma.adMetrics.findFirst({
        where: { product: productKey, channel: 'google' },
        orderBy: { date: 'desc' },
      }),
      prisma.adMetrics.findFirst({
        where: { product: productKey, channel: 'instagram' },
        orderBy: { date: 'desc' },
      }),
    ])

    // ---- AdMetrics weekly trend (past 12 weeks) ----
    const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000)
    const adRows = await prisma.adMetrics.findMany({
      where: { product: productKey, date: { gte: twelveWeeksAgo } },
      orderBy: { date: 'asc' },
      select: { date: true, spend: true, conversions: true },
    })

    // 週単位に丸めて集計（Monday-based buckets aligned to revenueTrend weeks）
    const adByWeek = new Map<string, { spend: number; revenue: number }>()
    for (const row of adRows) {
      // weekStart = 同じ revenueTrend の週に合わせる（7日単位）
      const msFromNow = now.getTime() - row.date.getTime()
      const weeksAgo = Math.floor(msFromNow / (7 * 24 * 60 * 60 * 1000))
      const weekEnd = new Date(now.getTime() - weeksAgo * 7 * 24 * 60 * 60 * 1000)
      const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000)
      const key = weekStart.toISOString()
      const existing = adByWeek.get(key) ?? { spend: 0, revenue: 0 }
      existing.spend += row.spend
      existing.revenue += row.conversions * 4000 // conversions × 平均単価 4000円
      adByWeek.set(key, existing)
    }

    const adTrend = Array.from(adByWeek.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekStart, { spend, revenue }]) => ({
        weekStart,
        spend: Math.round(spend),
        roas: spend > 0 ? Math.round((revenue / spend) * 100 * 10) / 10 : 0,
      }))

    // ---- Cohort data ----
    const cohort = await getCohortData(productKey)

    // ---- Revenue trend (weekly, past 12 weeks) ----
    const revenueTrend: {
      weekStart: string
      revenue: number
      newRevenue: number
      returningRevenue: number
    }[] = []

    for (let w = 11; w >= 0; w--) {
      const weekEnd = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000)
      const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000)

      const purchases = await prisma.purchaseHistory.findMany({
        where: {
          product: productKey,
          purchasedAt: { gte: weekStart, lt: weekEnd },
        },
        select: { customerId: true, revenue: true, purchasedAt: true },
      })

      // Determine new vs returning: any purchase before this week's start
      const customerIdsThisWeek = [...new Set(purchases.map((p) => p.customerId))]
      const priorBuyers =
        customerIdsThisWeek.length > 0
          ? await prisma.purchaseHistory.findMany({
              where: {
                product: productKey,
                purchasedAt: { lt: weekStart },
                customerId: { in: customerIdsThisWeek },
              },
              distinct: ['customerId'],
              select: { customerId: true },
            })
          : []
      const priorSet = new Set(priorBuyers.map((p) => p.customerId))

      let newRev = 0
      let retRev = 0
      for (const p of purchases) {
        if (priorSet.has(p.customerId)) retRev += p.revenue
        else newRev += p.revenue
      }

      revenueTrend.push({
        weekStart: weekStart.toISOString(),
        revenue: newRev + retRev,
        newRevenue: newRev,
        returningRevenue: retRev,
      })
    }

    const response = {
      product: productKey,
      period: {
        days,
        from: from.toISOString(),
        to: now.toISOString(),
      },
      lagging: {
        revenue: {
          value: revenueSummary.total,
          target: null,
          warning: null,
          alert: null,
          prevWeek: prevRevenue.total,
        },
        repeatRate: {
          value: Math.round(repeatRate * 10) / 10,
          target: repeatTarget?.targetValue ?? null,
          warning: repeatTarget?.warningThreshold ?? null,
          alert: repeatTarget?.alertThreshold ?? null,
          prevWeek: Math.round(prevRepeatRate * 10) / 10,
        },
        subscriptionRate: {
          value: Math.round(subscriptionRate * 10) / 10,
          target: subTarget?.targetValue ?? null,
          warning: subTarget?.warningThreshold ?? null,
          alert: subTarget?.alertThreshold ?? null,
          prevWeek: Math.round(prevSubscriptionRate * 10) / 10,
        },
        roas: {
          value: Math.round(avgRoas * 10) / 10,
          target: roasTarget?.targetValue ?? null,
          warning: roasTarget?.warningThreshold ?? null,
          alert: roasTarget?.alertThreshold ?? null,
          prevWeek: Math.round(prevAvgRoas * 10) / 10,
        },
      },
      leading: {
        cartAddRate: {
          value: 6.8,
          target: cartTarget?.targetValue ?? null,
          warning: cartTarget?.warningThreshold ?? null,
          alert: cartTarget?.alertThreshold ?? null,
          prevWeek: 7.2,
        },
        lineOpenRate: {
          value: 41.2,
          target: lineTarget?.targetValue ?? null,
          warning: lineTarget?.warningThreshold ?? null,
          alert: lineTarget?.alertThreshold ?? null,
          prevWeek: 43.5,
        },
        googleRoas: {
          value: latestGoogle ? Math.round(latestGoogle.roas * 10) / 10 : 0,
          channel: 'google',
        },
        igRoas: {
          value: latestIgAd ? Math.round(latestIgAd.roas * 10) / 10 : 0,
          channel: 'instagram',
        },
        igReach: {
          value: latestIg?.reach ?? 0,
        },
        igSaves: {
          value: latestIg?.saves ?? 0,
        },
      },
      cohort,
      revenueTrend,
      adTrend,
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[GET /api/kpi]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
