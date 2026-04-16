type Status = 'ok' | 'warning' | 'alert' | 'neutral'

interface KpiGaugeProps {
  label: string
  value: number
  target: number
  unit: string
  status: Status
  description: string
  warning?: number
  alert?: number
}

const barColor: Record<Status, string> = {
  ok:      'bg-emerald-500',
  warning: 'bg-amber-500',
  alert:   'bg-red-500',
  neutral: 'bg-slate-300',
}

const valueColor: Record<Status, string> = {
  ok:      'text-emerald-600',
  warning: 'text-amber-600',
  alert:   'text-red-600',
  neutral: 'text-slate-900',
}

const badgeStyle: Record<Status, string> = {
  ok:      'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  alert:   'bg-red-100 text-red-700',
  neutral: '',
}

const badgeLabel: Record<Status, string> = {
  ok:      '達成',
  warning: '要注意',
  alert:   '警告',
  neutral: '',
}

export default function KpiGauge({
  label,
  value,
  target,
  unit,
  status,
  description,
  warning,
  alert,
}: KpiGaugeProps) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
      {/* ヘッダー */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>
        {status !== 'neutral' && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${badgeStyle[status]}`}>
            {badgeLabel[status]}
          </span>
        )}
      </div>

      {/* 現在値 */}
      <div>
        <span className={`text-4xl font-bold leading-none ${valueColor[status]}`}>
          {unit === '円' ? `¥${value.toLocaleString()}` : `${value}${unit}`}
        </span>
      </div>

      {/* プログレスバー（目標なし or neutral のときは非表示） */}
      {status !== 'neutral' && target > 0 && (
        <div className="space-y-1">
          <div className="relative h-2.5 bg-slate-100 rounded-full overflow-visible">
            {/* 達成バー */}
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor[status]}`}
              style={{ width: `${pct}%` }}
            />
            {/* 目標マーカー（100%位置） */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-slate-400 rounded-full"
              style={{ left: '100%', transform: 'translate(-50%, -50%)' }}
            />
          </div>
          {/* バー下ラベル */}
          <div className="flex justify-between text-xs text-slate-400">
            <span>0{unit}</span>
            <span className="font-medium text-slate-500">目標 {unit === '円' ? `¥${target.toLocaleString()}` : `${target}${unit}`}</span>
          </div>
        </div>
      )}

      {/* 閾値フッター */}
      {(warning !== undefined || alert !== undefined) && (
        <p className="text-xs text-slate-400 border-t border-slate-100 pt-2 leading-relaxed">
          目標: {target}{unit}
          {warning !== undefined && ` ／ 要注意: ${warning}${unit}`}
          {alert !== undefined && ` ／ 警告: ${alert}${unit}`}
        </p>
      )}
    </div>
  )
}
