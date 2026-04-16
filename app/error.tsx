'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="text-4xl">⚠️</div>
      <h2 className="text-lg font-semibold text-slate-800">データの取得に失敗しました</h2>
      <p className="text-sm text-slate-500 text-center max-w-sm">
        {error.message || 'サーバーとの通信中にエラーが発生しました。'}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-slate-700 transition-colors"
        >
          再試行
        </button>
        <button
          onClick={() => router.push('/')}
          className="bg-slate-100 text-slate-700 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-slate-200 transition-colors"
        >
          ダッシュボードへ
        </button>
      </div>
    </div>
  )
}
