interface FormulaTreeProps {
  totalRevenue: number
  newRevenue: number
  returningRevenue: number
  newRatio: number
  returningRatio: number
  repeatRate: number
}

export default function FormulaTree({
  totalRevenue,
  newRevenue,
  returningRevenue,
  newRatio,
  returningRatio,
  repeatRate,
}: FormulaTreeProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-900">売上の因数分解</h2>
        <p className="text-xs text-slate-400 mt-0.5">直近4週（約30日）の売上構造</p>
      </div>

      <div className="p-6 space-y-4">
        {/* 第1階層: 月間売上 */}
        <div className="bg-slate-900 text-white rounded-xl px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              月間売上合計
            </p>
            <p className="text-3xl font-bold">¥{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="text-right text-sm text-slate-400">
            <p>新規 + リピート</p>
          </div>
        </div>

        {/* 接続線 */}
        <div className="flex justify-center">
          <div className="flex gap-24 items-start">
            <div className="flex flex-col items-center gap-0">
              <div className="w-px h-4 bg-slate-300" />
              <div className="w-24 h-px bg-slate-300" />
            </div>
            <div className="flex flex-col items-center gap-0">
              <div className="w-px h-4 bg-slate-300" />
            </div>
          </div>
        </div>

        {/* 第2階層: 新規売上 / リピート売上 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 新規売上 */}
          <div className="border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  新規売上
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  ¥{newRevenue.toLocaleString()}
                </p>
              </div>
              <span className="text-sm font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                {newRatio}%
              </span>
            </div>

            {/* 第3階層: 構成要素 */}
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                構成要素
              </p>
              <div className="space-y-1.5">
                {['訪問者数', 'CVR（コンバージョン率）', '平均単価'].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2"
                  >
                    <span className="text-slate-400">×</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* リピート売上 */}
          <div className="border-l-4 border-l-amber-400 border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  リピート売上
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  ¥{returningRevenue.toLocaleString()}
                </p>
              </div>
              <span className="text-sm font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                {returningRatio}%
              </span>
            </div>

            {/* 第3階層: 構成要素 */}
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                構成要素
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                  <span className="text-slate-400">×</span>
                  <span>既存顧客数</span>
                </div>
                <div className="flex items-center justify-between text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 text-amber-700">
                    <span className="text-amber-400">×</span>
                    <span className="font-medium">リピート率（60日）</span>
                  </div>
                  <span className="font-bold text-amber-700">{repeatRate}%</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                  <span className="text-slate-400">×</span>
                  <span>平均単価</span>
                </div>
              </div>
            </div>

            {/* レバレッジポイントバッジ */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <p className="text-xs font-semibold text-amber-700">
                📌 レバレッジポイント
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                リピート率を目標30%へ引き上げることで
                リピート売上+46%の試算
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
