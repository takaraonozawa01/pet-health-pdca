const BADGE_COLORS = {
  emerald: 'bg-emerald-100 text-emerald-700',
  amber:   'bg-amber-100 text-amber-700',
  red:     'bg-red-100 text-red-700',
  slate:   'bg-slate-100 text-slate-600',
} as const

interface PageHeaderProps {
  title: string
  subtitle?: string
  badge?: { text: string; color: keyof typeof BADGE_COLORS }
}

export default function PageHeader({ title, subtitle, badge }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {badge && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${BADGE_COLORS[badge.color]}`}>
            {badge.text}
          </span>
        )}
      </div>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      <hr className="mt-4 border-slate-200" />
    </div>
  )
}
