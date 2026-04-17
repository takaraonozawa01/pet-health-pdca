import path from 'path'
import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

function createPrismaClient() {
  // 絶対パスで dev.db を指定（Vercel サーバーレス環境対応）
  const dbPath = process.env.DATABASE_URL
    ?? `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`
  console.log('[db] connecting:', dbPath)
  const adapter = new PrismaBetterSqlite3({ url: dbPath })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
