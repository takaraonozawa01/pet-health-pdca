'use client'

import { useEffect, useState, useMemo } from 'react'
import ActionCard, { type Action } from '@/components/ActionCard'
import PageHeader from '@/components/PageHeader'

// ── types ──────────────────────────────────────────────────────────────────

type FilterKey = 'all' | 'high' | 'this_week' | 'no_effect'
type SortKey   = 'created_desc' | 'priority_desc' | 'due_asc'

interface NewActionForm {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  relatedKpi: string
  dueDate: string
}

// ── helpers ────────────────────────────────────────────────────────────────

function startOfWeek(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

function endOfWeek(): Date {
  const d = startOfWeek()
  d.setDate(d.getDate() + 6)
  return d
}

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

function sortActions(actions: Action[], sort: SortKey): Action[] {
  return [...actions].sort((a, b) => {
    if (sort === 'created_desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    if (sort === 'priority_desc') return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)
    if (sort === 'due_asc') {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    }
    return 0
  })
}

function filterActions(actions: Action[], filter: FilterKey): Action[] {
  if (filter === 'all') return actions
  if (filter === 'high') return actions.filter((a) => a.priority === 'high')
  if (filter === 'this_week') {
    const start = startOfWeek()
    const end = endOfWeek()
    return actions.filter((a) => {
      if (!a.dueDate) return false
      const d = new Date(a.dueDate)
      return d >= start && d <= end
    })
  }
  if (filter === 'no_effect') return actions.filter((a) => a.status === 'done' && !a.effectRating)
  return actions
}

// ── columns ────────────────────────────────────────────────────────────────

const COLUMNS: { status: string; label: string; bg: string; badge: string }[] = [
  { status: 'proposed',    label: '提案',   bg: 'bg-slate-100',   badge: 'bg-slate-200 text-slate-700' },
  { status: 'in_progress', label: '実行中', bg: 'bg-blue-50',     badge: 'bg-blue-200 text-blue-700' },
  { status: 'done',        label: '完了',   bg: 'bg-emerald-50',  badge: 'bg-emerald-200 text-emerald-700' },
  { status: 'rejected',    label: '却下',   bg: 'bg-gray-50',     badge: 'bg-gray-200 text-gray-600' },
]

// ── component ──────────────────────────────────────────────────────────────

export default function ActionsPage() {
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)

  // filter / sort
  const [filter, setFilter] = useState<FilterKey>('all')
  const [sort, setSort]     = useState<SortKey>('created_desc')

  // modals
  const [effectTarget, setEffectTarget] = useState<Action | null>(null)
  const [effectRating, setEffectRating] = useState<'high' | 'low' | 'none' | ''>('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [newForm, setNewForm] = useState<NewActionForm>({
    title: '', description: '', priority: 'medium', relatedKpi: 'repeat_rate', dueDate: '',
  })
  const [saving, setSaving] = useState(false)
  const [mobileCol, setMobileCol] = useState<string>('proposed')

  // ── data ──

  async function fetchActions() {
    const res = await fetch('/api/actions?product=TIERRA')
    const data: Action[] = await res.json()
    setActions(data)
    setLoading(false)
  }

  useEffect(() => { fetchActions() }, [])

  // ── derived ──

  const displayed = useMemo(() => {
    return sortActions(filterActions(actions, filter), sort)
  }, [actions, filter, sort])

  const byStatus = (status: string) => displayed.filter((a) => a.status === status)

  const stats = {
    proposed:    actions.filter((a) => a.status === 'proposed').length,
    in_progress: actions.filter((a) => a.status === 'in_progress').length,
    done:        actions.filter((a) => a.status === 'done').length,
    rejected:    actions.filter((a) => a.status === 'rejected').length,
  }

  // ── handlers ──

  async function handleStatusChange(id: number, status: string, effectRating?: string) {
    const body: Record<string, string> = { status }
    if (effectRating) body.effectRating = effectRating
    await fetch(`/api/actions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    await fetchActions()
  }

  async function handleEffectSave() {
    if (!effectTarget || !effectRating) return
    setSaving(true)
    await fetch(`/api/actions/${effectTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done', effectRating }),
    })
    setSaving(false)
    setEffectTarget(null)
    setEffectRating('')
    await fetchActions()
  }

  async function handleNewSave() {
    if (!newForm.title) return
    setSaving(true)
    await fetch('/api/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'manual',
        product: 'TIERRA',
        title: newForm.title,
        description: newForm.description || '（説明なし）',
        priority: newForm.priority,
        status: 'proposed',
        relatedKpi: newForm.relatedKpi,
        dueDate: newForm.dueDate || null,
      }),
    })
    setSaving(false)
    setShowNewModal(false)
    setNewForm({ title: '', description: '', priority: 'medium', relatedKpi: 'repeat_rate', dueDate: '' })
    await fetchActions()
  }

  // ── render ──

  return (
    <div className="space-y-6">
      {/* title + new button */}
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="アクション管理"
          subtitle="PDCAサイクルのA→P連鎖を管理する"
        />
        <button
          onClick={() => setShowNewModal(true)}
          className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm mt-1"
        >
          + 追加
        </button>
      </div>

        {/* stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs text-slate-500 mb-1">提案中</p>
            <p className="text-2xl font-bold text-slate-800">{stats.proposed}</p>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-100 shadow-sm p-4">
            <p className="text-xs text-blue-500 mb-1">実行中</p>
            <p className="text-2xl font-bold text-blue-700">{stats.in_progress}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm p-4">
            <p className="text-xs text-emerald-500 mb-1">完了</p>
            <p className="text-2xl font-bold text-emerald-700">{stats.done}</p>
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs text-gray-400 mb-1">却下</p>
            <p className="text-2xl font-bold text-gray-500">{stats.rejected}</p>
          </div>
        </div>

        {/* filter + sort */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
            {([
              { key: 'all',       label: 'すべて' },
              { key: 'high',      label: '高優先度' },
              { key: 'this_week', label: '今週期限' },
              { key: 'no_effect', label: '効果未記録' },
            ] as { key: FilterKey; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                  filter === key
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <option value="created_desc">追加日（新しい順）</option>
            <option value="priority_desc">優先度（高い順）</option>
            <option value="due_asc">期限（近い順）</option>
          </select>
        </div>

        {/* kanban */}
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm">読み込み中…</div>
        ) : (
          <>
            {/* Mobile: tab switcher */}
            <div className="flex md:hidden gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm mb-3">
              {COLUMNS.map(({ status, label, badge }) => {
                const count = byStatus(status).length
                return (
                  <button
                    key={status}
                    onClick={() => setMobileCol(status)}
                    className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                      mobileCol === status
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {label}
                    <span className={`ml-1 text-[10px] font-bold px-1 py-0.5 rounded-full ${
                      mobileCol === status ? 'bg-white/20' : badge
                    }`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Mobile: single column */}
            <div className="md:hidden">
              {COLUMNS.filter(({ status }) => status === mobileCol).map(({ status, label, bg, badge }) => {
                const cards = byStatus(status)
                return (
                  <div key={status} className={`${bg} rounded-xl p-4 space-y-3`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">{label}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge}`}>{cards.length}</span>
                    </div>
                    {cards.length === 0 ? (
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                        <p className="text-xs text-slate-400">このステータスのアクションはありません</p>
                      </div>
                    ) : (
                      cards.map((action) => (
                        <ActionCard
                          key={action.id}
                          action={action}
                          onStatusChange={handleStatusChange}
                          onOpenEffectModal={(a) => { setEffectTarget(a); setEffectRating('') }}
                        />
                      ))
                    )}
                  </div>
                )
              })}
            </div>

            {/* Desktop: 4 columns */}
            <div className="hidden md:grid md:grid-cols-4 gap-4">
              {COLUMNS.map(({ status, label, bg, badge }) => {
                const cards = byStatus(status)
                return (
                  <div key={status} className={`${bg} rounded-xl p-4 space-y-3`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">{label}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge}`}>{cards.length}</span>
                    </div>
                    {cards.length === 0 ? (
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                        <p className="text-xs text-slate-400">このステータスのアクションはありません</p>
                      </div>
                    ) : (
                      cards.map((action) => (
                        <ActionCard
                          key={action.id}
                          action={action}
                          onStatusChange={handleStatusChange}
                          onOpenEffectModal={(a) => { setEffectTarget(a); setEffectRating('') }}
                        />
                      ))
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

      {/* ── 効果評価モーダル ── */}
      {effectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">アクションの効果を記録</h2>
              <p className="text-sm text-slate-500 mt-1">{effectTarget.title}</p>
            </div>

            <div className="space-y-2">
              {([
                { value: 'high', icon: '🎯', label: '効果大',  sub: 'KPIが明確に改善した' },
                { value: 'low',  icon: '📊', label: '効果小',  sub: 'わずかに改善が見られた' },
                { value: 'none', icon: '➖', label: '効果なし', sub: '変化が確認できなかった' },
              ] as { value: 'high' | 'low' | 'none'; icon: string; label: string; sub: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setEffectRating(opt.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors text-left ${
                    effectRating === opt.value
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{opt.label}</p>
                    <p className="text-xs text-slate-500">{opt.sub}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleEffectSave}
                disabled={!effectRating || saving}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-medium text-sm py-2.5 rounded-xl transition-colors"
              >
                {saving ? '保存中…' : '記録する'}
              </button>
              <button
                onClick={() => { setEffectTarget(null); setEffectRating('') }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm py-2.5 rounded-xl transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 新規アクションモーダル ── */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-5">
            <h2 className="text-lg font-bold text-slate-900">新規アクションを追加</h2>

            <div className="space-y-4">
              {/* title */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newForm.title}
                  onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                  placeholder="アクション名を入力"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {/* description */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">説明</label>
                <textarea
                  rows={3}
                  value={newForm.description}
                  onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                  placeholder="施策の詳細を入力"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* priority */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">優先度</label>
                  <select
                    value={newForm.priority}
                    onChange={(e) => setNewForm({ ...newForm, priority: e.target.value as 'high' | 'medium' | 'low' })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="high">高</option>
                    <option value="medium">中</option>
                    <option value="low">低</option>
                  </select>
                </div>

                {/* dueDate */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">期限（任意）</label>
                  <input
                    type="date"
                    value={newForm.dueDate}
                    onChange={(e) => setNewForm({ ...newForm, dueDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              {/* relatedKpi */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">関連KPI</label>
                <select
                  value={newForm.relatedKpi}
                  onChange={(e) => setNewForm({ ...newForm, relatedKpi: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="repeat_rate">repeat_rate</option>
                  <option value="subscription_rate">subscription_rate</option>
                  <option value="roas">roas</option>
                  <option value="cart_add_rate">cart_add_rate</option>
                  <option value="line_open_rate">line_open_rate</option>
                  <option value="cvr">cvr</option>
                  <option value="other">other</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleNewSave}
                disabled={!newForm.title || saving}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-medium text-sm py-2.5 rounded-xl transition-colors"
              >
                {saving ? '追加中…' : '追加する'}
              </button>
              <button
                onClick={() => setShowNewModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm py-2.5 rounded-xl transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
