import path from 'path'
import fs from 'fs'
import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

function resolveDbPath(): string {
  // 明示的な DATABASE_URL がある場合はそちらを優先
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL.replace(/^file:/, '')
  }

  const bundledPath = path.join(process.cwd(), 'prisma', 'dev.db')

  // Vercel サーバーレス: /var/task は読み取り専用のため /tmp にコピー
  if (process.env.VERCEL) {
    const tmpPath = '/tmp/dev.db'
    if (!fs.existsSync(tmpPath)) {
      if (fs.existsSync(bundledPath)) {
        console.log('[db] copying bundled DB to /tmp/dev.db')
        fs.copyFileSync(bundledPath, tmpPath)
      } else {
        console.warn('[db] bundled DB not found at', bundledPath, '— starting empty')
      }
    }
    return tmpPath
  }

  return bundledPath
}

function createPrismaClient() {
  const dbPath = resolveDbPath()
  console.log('[db] connecting:', dbPath)
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
