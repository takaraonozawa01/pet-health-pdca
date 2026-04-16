import { prisma } from './db'

/**
 * 初回購入からdays日以内に2回目購入した顧客の割合
 */
export async function getRepeatRate(product: string, days: number): Promise<number> {
  const purchases = await prisma.purchaseHistory.findMany({
    where: { product },
    orderBy: { purchasedAt: 'asc' },
    select: { customerId: true, purchasedAt: true },
  })

  // 顧客ごとに購入日を集計
  const byCustomer = new Map<string, Date[]>()
  for (const p of purchases) {
    const existing = byCustomer.get(p.customerId) ?? []
    existing.push(p.purchasedAt)
    byCustomer.set(p.customerId, existing)
  }

  let totalFirstBuyers = 0
  let repeatBuyers = 0

  for (const [, dates] of byCustomer) {
    const sorted = dates.sort((a, b) => a.getTime() - b.getTime())
    totalFirstBuyers++
    if (sorted.length >= 2) {
      const diffMs = sorted[1].getTime() - sorted[0].getTime()
      const diffDays = diffMs / (1000 * 60 * 60 * 24)
      if (diffDays <= days) {
        repeatBuyers++
      }
    }
  }

  if (totalFirstBuyers === 0) return 0
  return (repeatBuyers / totalFirstBuyers) * 100
}

/**
 * 顧客1人あたりの平均累計購買額（days日間）
 */
export async function getLtv(product: string, days: number): Promise<number> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const purchases = await prisma.purchaseHistory.findMany({
    where: {
      product,
      purchasedAt: { gte: since },
    },
    select: { customerId: true, revenue: true },
  })

  if (purchases.length === 0) return 0

  const revenueByCustomer = new Map<string, number>()
  for (const p of purchases) {
    revenueByCustomer.set(p.customerId, (revenueByCustomer.get(p.customerId) ?? 0) + p.revenue)
  }

  const total = Array.from(revenueByCustomer.values()).reduce((sum, v) => sum + v, 0)
  return total / revenueByCustomer.size
}

/**
 * 購入月別のリピート率コホートデータ
 */
export async function getCohortData(product: string): Promise<
  Array<{
    cohortMonth: string
    totalBuyers: number
    repeaters: number
    repeatRatePct: number
  }>
> {
  const purchases = await prisma.purchaseHistory.findMany({
    where: { product },
    orderBy: { purchasedAt: 'asc' },
    select: { customerId: true, purchasedAt: true },
  })

  // 顧客ごとに購入日リストを構築（昇順済み）
  const purchasesByCustomer = new Map<string, Date[]>()
  for (const p of purchases) {
    const dates = purchasesByCustomer.get(p.customerId) ?? []
    dates.push(p.purchasedAt)
    purchasesByCustomer.set(p.customerId, dates)
  }

  // 顧客ごとの初回購入日と「60日以内リピーター」判定
  const firstPurchaseByCustomer = new Map<string, Date>()
  const within60DaysRepeaters = new Set<string>()
  const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000

  for (const [customerId, dates] of purchasesByCustomer) {
    const first = dates[0] // 昇順なので先頭が初回
    firstPurchaseByCustomer.set(customerId, first)

    // 2回目以降の購入が初回から60日以内にあるか確認
    for (let i = 1; i < dates.length; i++) {
      if (dates[i].getTime() - first.getTime() <= SIXTY_DAYS_MS) {
        within60DaysRepeaters.add(customerId)
        break
      }
    }
  }

  // コホート月ごとに集計
  const cohortMap = new Map<string, { total: number; repeaters: number }>()
  for (const [customerId, firstDate] of firstPurchaseByCustomer) {
    const month = `${firstDate.getFullYear()}-${String(firstDate.getMonth() + 1).padStart(2, '0')}`
    const existing = cohortMap.get(month) ?? { total: 0, repeaters: 0 }
    existing.total++
    if (within60DaysRepeaters.has(customerId)) existing.repeaters++
    cohortMap.set(month, existing)
  }

  return Array.from(cohortMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cohortMonth, { total, repeaters }]) => ({
      cohortMonth,
      totalBuyers: total,
      repeaters,
      repeatRatePct: total > 0 ? Math.round((repeaters / total) * 1000) / 10 : 0,
    }))
}

/**
 * 基準日を指定して初回購入からdays日以内リピート率を計算（prevWeek用）
 */
export async function getRepeatRateAt(
  product: string,
  days: number,
  baseDate: Date
): Promise<number> {
  // baseDate より前の全購入を対象にする
  const purchases = await prisma.purchaseHistory.findMany({
    where: { product, purchasedAt: { lt: baseDate } },
    orderBy: { purchasedAt: 'asc' },
    select: { customerId: true, purchasedAt: true },
  })

  const byCustomer = new Map<string, Date[]>()
  for (const p of purchases) {
    const existing = byCustomer.get(p.customerId) ?? []
    existing.push(p.purchasedAt)
    byCustomer.set(p.customerId, existing)
  }

  let totalFirstBuyers = 0
  let repeatBuyers = 0
  for (const [, dates] of byCustomer) {
    const sorted = dates.sort((a, b) => a.getTime() - b.getTime())
    totalFirstBuyers++
    if (sorted.length >= 2) {
      const diffDays = (sorted[1].getTime() - sorted[0].getTime()) / (1000 * 60 * 60 * 24)
      if (diffDays <= days) repeatBuyers++
    }
  }

  if (totalFirstBuyers === 0) return 0
  return (repeatBuyers / totalFirstBuyers) * 100
}

/**
 * 基準日を指定して定期転換率を計算（prevWeek用）
 */
export async function getSubscriptionRateAt(
  product: string,
  baseDate: Date
): Promise<number> {
  const [totalCustomers, subCustomers] = await Promise.all([
    prisma.purchaseHistory.findMany({
      where: { product, purchasedAt: { lt: baseDate } },
      distinct: ['customerId'],
      select: { customerId: true },
    }),
    prisma.purchaseHistory.findMany({
      where: { product, isSubscription: true, purchasedAt: { lt: baseDate } },
      distinct: ['customerId'],
      select: { customerId: true },
    }),
  ])
  if (totalCustomers.length === 0) return 0
  return (subCustomers.length / totalCustomers.length) * 100
}

/**
 * 基準日・期間を指定して売上サマリーを計算（prevWeek用）
 */
export async function getRevenueSummaryAt(
  product: string,
  days: number,
  baseDate: Date
): Promise<{ total: number; newCustomers: number; returningCustomers: number }> {
  const since = new Date(baseDate.getTime() - days * 24 * 60 * 60 * 1000)

  const periodPurchases = await prisma.purchaseHistory.findMany({
    where: { product, purchasedAt: { gte: since, lt: baseDate } },
    select: { customerId: true, revenue: true, purchasedAt: true },
  })

  const priorCustomerIds = new Set(
    (
      await prisma.purchaseHistory.findMany({
        where: { product, purchasedAt: { lt: since } },
        distinct: ['customerId'],
        select: { customerId: true },
      })
    ).map((p) => p.customerId)
  )

  let newRevenue = 0
  let returningRevenue = 0
  for (const p of periodPurchases) {
    if (priorCustomerIds.has(p.customerId)) returningRevenue += p.revenue
    else newRevenue += p.revenue
  }

  return { total: newRevenue + returningRevenue, newCustomers: newRevenue, returningCustomers: returningRevenue }
}

/**
 * isSubscription=trueの購入者 ÷ 全購入者
 */
export async function getSubscriptionRate(product: string): Promise<number> {
  const [totalCustomers, subCustomers] = await Promise.all([
    prisma.purchaseHistory.findMany({
      where: { product },
      distinct: ['customerId'],
      select: { customerId: true },
    }),
    prisma.purchaseHistory.findMany({
      where: { product, isSubscription: true },
      distinct: ['customerId'],
      select: { customerId: true },
    }),
  ])

  if (totalCustomers.length === 0) return 0
  return (subCustomers.length / totalCustomers.length) * 100
}

/**
 * 新規・リピート別の売上サマリー
 */
export async function getRevenueSummary(
  product: string,
  days: number
): Promise<{ total: number; newCustomers: number; returningCustomers: number }> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  // 対象期間の全購入
  const periodPurchases = await prisma.purchaseHistory.findMany({
    where: { product, purchasedAt: { gte: since } },
    select: { customerId: true, revenue: true, purchasedAt: true },
  })

  // 対象期間より前に購入したことがある顧客
  const priorCustomerIds = new Set(
    (
      await prisma.purchaseHistory.findMany({
        where: { product, purchasedAt: { lt: since } },
        distinct: ['customerId'],
        select: { customerId: true },
      })
    ).map((p) => p.customerId)
  )

  let newRevenue = 0
  let returningRevenue = 0

  for (const p of periodPurchases) {
    if (priorCustomerIds.has(p.customerId)) {
      returningRevenue += p.revenue
    } else {
      newRevenue += p.revenue
    }
  }

  return {
    total: newRevenue + returningRevenue,
    newCustomers: newRevenue,
    returningCustomers: returningRevenue,
  }
}
