import path from 'path'
import fs from 'fs'
import Database from 'better-sqlite3'
import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

// マイグレーション SQL（schema.prisma の内容と一致）
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS "PurchaseHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "purchasedAt" DATETIME NOT NULL,
    "shop" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "revenue" REAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "isSubscription" BOOLEAN NOT NULL DEFAULT false,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "PurchaseHistory_orderId_key" ON "PurchaseHistory"("orderId");

CREATE TABLE IF NOT EXISTS "AdMetrics" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "channel" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "spend" REAL NOT NULL,
    "impressions" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "ctr" REAL NOT NULL,
    "conversions" INTEGER NOT NULL,
    "cpa" REAL NOT NULL,
    "roas" REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS "SnsMetrics" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "weekStart" DATETIME NOT NULL,
    "channel" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "reach" INTEGER NOT NULL,
    "saves" INTEGER NOT NULL,
    "followersDelta" INTEGER NOT NULL,
    "engagementRate" REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS "LineMetrics" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sentAt" DATETIME NOT NULL,
    "product" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "sent" INTEGER NOT NULL,
    "opens" INTEGER NOT NULL,
    "openRate" REAL NOT NULL,
    "clicks" INTEGER NOT NULL,
    "ctr" REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS "Action" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "source" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "relatedKpi" TEXT NOT NULL,
    "effectRating" TEXT,
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AiReport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "weekStart" DATETIME NOT NULL,
    "promptText" TEXT NOT NULL,
    "resultText" TEXT,
    "resultJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "KpiTarget" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "product" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "targetValue" REAL NOT NULL,
    "warningThreshold" REAL NOT NULL,
    "alertThreshold" REAL NOT NULL
);
`

function resolveDbPath(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL.replace(/^file:/, '')
  }
  // Vercel サーバーレス: /tmp のみ書き込み可能
  if (process.env.VERCEL) {
    return '/tmp/dev.db'
  }
  return path.join(process.cwd(), 'prisma', 'dev.db')
}

function initSchema(dbPath: string) {
  const raw = new Database(dbPath)
  raw.exec(SCHEMA_SQL)
  raw.close()
}

function createPrismaClient() {
  const dbPath = resolveDbPath()
  console.log('[db] path:', dbPath)

  // テーブルが存在しない場合にスキーマを作成（Vercel 初回起動時など）
  initSchema(dbPath)

  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
