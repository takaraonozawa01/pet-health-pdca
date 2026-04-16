'use client'

export interface Action {
  id: number
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  status: string
  relatedKpi: string
  effectRating: string | null
  dueDate: string | null
  createdAt: string
}

interface ActionCardProps {
  action: Action
  onStatusChange: (id: number, status: string, effectRating?: string) => void
  onOpenEffectModal: (action: Action) => void
}

const PRIORITY_BADGE: Record<string, { label: string; className: string }> = {
  high:   { label: '優先度 高', className: 'bg-red-100 text-red-700' },
  medium: { label: '優先度 中', className: 'bg-amber-100 text-amber-700' },
  low:    { label: '優先度 低', className: 'bg-slate-100 text-slate-600' },
}

const EFFECT_BADGE: Record<string, { label: string; className: string }> = {
  high: { label: '効果: 大 🎯', className: 'bg-emerald-100 text-emerald-700' },
  low:  { label: '効果: 小',    className: 'bg-slate-100 text-slate-600' },
  none: { label: '効果: なし',  className: 'bg-gray-100 text-gray-500' },
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function isDuePast(dueDate: string): boolean {
  return new Date() > new Date(dueDate)
}

export default function ActionCard({ action, onStatusChange, onOpenEffectModal }: ActionCardProps) {
  const priorityBadge = PRIORITY_BADGE[action.priority] ?? PRIORITY_BADGE.low

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3">
      {/* badges row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityBadge.className}`}>
          {priorityBadge.label}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200 font-mono">
          {action.relatedKpi}
        </span>
      </div>

      {/* title + description */}
      <div>
        <p className="font-medium text-slate-900 text-sm leading-snug">{action.title}</p>
        <p className="text-sm text-slate-600 mt-1 line-clamp-2 leading-relaxed">{action.description}</p>
      </div>

      {/* meta */}
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span>{formatDate(action.createdAt)}追加</span>
        {action.dueDate && (
          <span className={isDuePast(action.dueDate) ? 'text-red-500 font-medium' : ''}>
            期限: {formatDate(action.dueDate)}
          </span>
        )}
      </div>

      {/* effect badge for done */}
      {action.status === 'done' && action.effectRating && EFFECT_BADGE[action.effectRating] && (
        <div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${EFFECT_BADGE[action.effectRating].className}`}>
            {EFFECT_BADGE[action.effectRating].label}
          </span>
        </div>
      )}

      {/* action buttons */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
        {action.status === 'proposed' && (
          <>
            <button
              onClick={() => onStatusChange(action.id, 'in_progress')}
              className="flex-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              実行開始 →
            </button>
            <button
              onClick={() => onStatusChange(action.id, 'rejected')}
              className="text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              却下
            </button>
          </>
        )}

        {action.status === 'in_progress' && (
          <>
            <button
              onClick={() => onOpenEffectModal(action)}
              className="flex-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              完了 ✓
            </button>
            <button
              onClick={() => onStatusChange(action.id, 'proposed')}
              className="text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              提案に戻す
            </button>
          </>
        )}

        {action.status === 'done' && !action.effectRating && (
          <button
            onClick={() => onOpenEffectModal(action)}
            className="text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg transition-colors"
          >
            効果を記録
          </button>
        )}

        {action.status === 'rejected' && (
          <button
            onClick={() => onStatusChange(action.id, 'proposed')}
            className="text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg transition-colors"
          >
            提案に戻す
          </button>
        )}
      </div>
    </div>
  )
}
