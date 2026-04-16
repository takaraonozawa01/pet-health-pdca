import 'dotenv/config'
import { PrismaClient } from '../app/generated/prisma'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import * as fs from 'fs'
import * as path from 'path'

const url = process.env.DATABASE_URL ?? 'file:./prisma/dev.db'
const adapter = new PrismaBetterSqlite3({ url })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  const mockDir = path.join(__dirname, '..', 'data', 'mock')

  // ---- PurchaseHistory ----
  const purchaseData = JSON.parse(
    fs.readFileSync(path.join(mockDir, 'purchase_history.json'), 'utf-8')
  )
  await prisma.purchaseHistory.deleteMany()
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
  console.log(`✓ PurchaseHistory: ${purchaseData.length} records`)

  // ---- AdMetrics ----
  const adData = JSON.parse(
    fs.readFileSync(path.join(mockDir, 'ad_metrics.json'), 'utf-8')
  )
  await prisma.adMetrics.deleteMany()
  await prisma.adMetrics.createMany({
    data: adData.map((row: {
      date: string; channel: string; product: string; spend: number;
      impressions: number; clicks: number; ctr: number; conversions: number;
      cpa: number; roas: number;
    }) => ({
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
  console.log(`✓ AdMetrics: ${adData.length} records`)

  // ---- SnsMetrics ----
  const snsData = JSON.parse(
    fs.readFileSync(path.join(mockDir, 'sns_metrics.json'), 'utf-8')
  )
  await prisma.snsMetrics.deleteMany()
  await prisma.snsMetrics.createMany({
    data: snsData.map((row: {
      weekStart: string; channel: string; product: string; reach: number;
      saves: number; followersDelta: number; engagementRate: number;
    }) => ({
      weekStart: new Date(row.weekStart),
      channel: row.channel,
      product: row.product,
      reach: row.reach,
      saves: row.saves,
      followersDelta: row.followersDelta,
      engagementRate: row.engagementRate,
    })),
  })
  console.log(`✓ SnsMetrics: ${snsData.length} records`)

  // ---- KpiTargets ----
  const kpiData = JSON.parse(
    fs.readFileSync(path.join(mockDir, 'kpi_targets.json'), 'utf-8')
  )
  await prisma.kpiTarget.deleteMany()
  await prisma.kpiTarget.createMany({
    data: kpiData.map((row: {
      product: string; metricName: string; targetValue: number;
      warningThreshold: number; alertThreshold: number;
    }) => ({
      product: row.product,
      metricName: row.metricName,
      targetValue: row.targetValue,
      warningThreshold: row.warningThreshold,
      alertThreshold: row.alertThreshold,
    })),
  })
  console.log(`✓ KpiTargets: ${kpiData.length} records`)

  console.log('✅ Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
