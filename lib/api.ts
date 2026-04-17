export function getBaseUrl(): string {
  // サーバーサイド（Vercel本番）
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  // ローカル開発
  return 'http://localhost:3000'
}
