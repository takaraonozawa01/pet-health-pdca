type Level = 'ok' | 'warning' | 'alert'

interface AlertBadgeProps {
  level: Level
  message: string
}

const styles: Record<Level, { bg: string; text: string; icon: string; label: string }> = {
  ok:      { bg: 'bg-emerald-50', text: 'text-emerald-800', icon: '✓', label: '達成' },
  warning: { bg: 'bg-amber-50',   text: 'text-amber-800',   icon: '⚠', label: '要注意' },
  alert:   { bg: 'bg-red-50',     text: 'text-red-800',     icon: '✕', label: '警告' },
}

export default function AlertBadge({ level, message }: AlertBadgeProps) {
  const s = styles[level]
  return (
    <div className={`flex items-start gap-2 rounded-lg px-4 py-3 ${s.bg}`}>
      <span className={`mt-0.5 text-sm font-bold ${s.text}`}>{s.icon}</span>
      <div>
        <span className={`text-xs font-semibold uppercase tracking-wide ${s.text} opacity-70`}>
          {s.label}
        </span>
        <p className={`text-sm font-medium ${s.text}`}>{message}</p>
      </div>
    </div>
  )
}
