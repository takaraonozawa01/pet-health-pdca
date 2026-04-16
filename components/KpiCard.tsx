type Status = 'ok' | 'warning' | 'alert' | 'neutral'

interface KpiCardProps {
  label: string
  value: string
  target?: string
  status: Status
  trend?: number
}

const borderColor: Record<Status, string> = {
  ok:      'border-l-emerald-500',
  warning: 'border-l-amber-500',
  alert:   'border-l-red-500',
  neutral: 'border-l-slate-300',
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

export default function KpiCard({ label, value, target, status, trend }: KpiCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 border-l-4 ${borderColor[status]} p-5 shadow-sm`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        {status !== 'neutral' && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeStyle[status]}`}>
            {badgeLabel[status]}
          </span>
        )}
      </div>

      <p className="text-3xl font-bold text-slate-900 leading-none mb-2">{value}</p>

      <div className="flex items-center gap-3 mt-1">
        {target && (
          <span className="text-xs text-slate-400">{target}</span>
        )}
        {trend !== undefined && (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? '↑' : '↓'}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  )
}
