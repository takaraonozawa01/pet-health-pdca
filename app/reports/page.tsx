'use client'

import { useState, useCallback } from 'react'
import { buildWeeklyPrompt } from '@/lib/prompt-builder'
import PageHeader from '@/components/PageHeader'

// ─── 型定義 ───
interface KpiMetric {
  value: number
  target: number | null
  warning: number | null
  alert: number | null
  prevWeek?: number
}

interface KpiResponse {
  period: { days: number; from: string; to: string }
  lagging: {
    revenue:          KpiMetric
    repeatRate:       KpiMetric
    subscriptionRate: KpiMetric
    roas:             KpiMetric
  }
  leading: {
    cartAddRate:  KpiMetric
    lineOpenRate: KpiMetric
  }
  cohort: Array<{ cohortMonth: string; repeatRatePct: number }>
}

interface Action {
  id: number
  title: string
  status: string
  effectRating: string | null
}

interface ReportJson {
  summary?: string
  alerts?: Array<{ kpi: string; level: string; reason: string }>
  recommendations?: Array<{
    priority: number
    title: string
    detail: string
    relatedKpi: string
    effort: string
  }>
}

interface Report {
  id: number
  weekStart: string
  promptText: string
  resultText: string | null
  resultJson: string | null
  createdAt: string
}

// ─── ユーティリティ ───
function getMondayISO(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function formatWeek(iso: string): string {
  const d = new Date(iso)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const weekOfMonth = Math.ceil(d.getDate() / 7)
  return `${year}年${month}月第${weekOfMonth}週`
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const EFFORT_LABEL: Record<string, string> = { low: '1時間以内', medium: '半日', high: '1日以上' }
const EFFORT_COLOR: Record<string, string> = {
  low:    'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high:   'bg-red-100 text-red-700',
}

// ─── RecommendationCard ───
function RecommendationCard({
  rec,
}: {
  rec: NonNullable<ReportJson['recommendations']>[number]
}) {
  const [added, setAdded] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleAdd() {
    if (added || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'ai_suggestion',
          product: 'TIERRA',
          title: rec.title,
          description: rec.detail,
          priority: rec.priority === 1 ? 'high' : rec.priority === 2 ? 'medium' : 'low',
          status: 'proposed',
          relatedKpi: rec.relatedKpi,
          dueDate: null,
        }),
      })
      if (res.ok) setAdded(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-slate-200 rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="text-xs font-bold text-slate-400">#{rec.priority}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${EFFORT_COLOR[rec.effort] ?? 'bg-slate-100 text-slate-600'}`}>
              {EFFORT_LABEL[rec.effort] ?? rec.effort}
            </span>
            <span className="text-xs text-slate-400">{rec.relatedKpi}</span>
          </div>
          <p className="text-sm font-semibold text-slate-900">{rec.title}</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{rec.detail}</p>
        </div>
      </div>
      <button
        onClick={handleAdd}
        disabled={added || loading}
        className={`w-full text-xs font-semibold py-1.5 rounded transition-all ${
          added
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
            : loading
            ? 'bg-slate-100 text-slate-400 cursor-wait'
            : 'bg-slate-900 text-white hover:bg-slate-700 active:scale-95'
        }`}
      >
        {added ? '追加済み ✓' : loading ? '追加中...' : 'アクションに追加 +'}
      </button>
    </div>
  )
}

// ─── ReportCard ───
function ReportCard({ report, onRefresh }: { report: Report; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false)

  let parsed: ReportJson | null = null
  if (report.resultJson) {
    try { parsed = JSON.parse(report.resultJson) } catch { /* ignore */ }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <p className="text-sm font-bold text-slate-900">{formatWeek(report.weekStart)}</p>
            <p className="text-xs text-slate-400 mt-0.5">保存: {formatDateTime(report.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {parsed?.alerts && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                警告 {parsed.alerts.length}件
              </span>
            )}
            {parsed?.recommendations && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                推奨 {parsed.recommendations.length}件
              </span>
            )}
          </div>
        </div>

        {parsed?.summary ? (
          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 rounded-lg px-3 py-2">
            {parsed.summary}
          </p>
        ) : (
          <p className="text-xs text-slate-400 italic">（回答未記入）</p>
        )}

        <button
          onClick={() => setExpanded((p) => !p)}
          className="mt-3 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
        >
          {expanded ? '▲ 閉じる' : '▼ 詳細を見る'}
        </button>
      </div>

      {expanded && parsed && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-4 bg-slate-50/50">
          {/* アラート */}
          {parsed.alerts && parsed.alerts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                アラート
              </p>
              <div className="space-y-2">
                {parsed.alerts.map((a, i) => (
                  <div key={i} className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-red-600">{a.kpi}</span>
                      <span className="text-xs text-red-400">{a.level}</span>
                    </div>
                    <p className="text-xs text-red-700 leading-relaxed">{a.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 推奨アクション */}
          {parsed.recommendations && parsed.recommendations.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                推奨アクション
              </p>
              <div className="space-y-2">
                {parsed.recommendations
                  .sort((a, b) => a.priority - b.priority)
                  .map((rec, i) => (
                    <RecommendationCard key={i} rec={rec} />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── メインページ ───
export default function ReportsPage() {
  const [prompt, setPrompt] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [reports, setReports] = useState<Report[]>([])
  const [reportsLoaded, setReportsLoaded] = useState(false)

  // レポート一覧を取得
  const fetchReports = useCallback(async () => {
    const res = await fetch('/api/reports')
    const data: Report[] = await res.json()
    setReports(data)
    setReportsLoaded(true)
  }, [])

  // 初回マウント時にレポートを取得
  useState(() => { fetchReports() })

  // プロンプト生成
  async function handleGenerate() {
    setGenerating(true)
    try {
      const [kpiRes, actionsRes] = await Promise.all([
        fetch('/api/kpi?product=tierra&days=60'),
        fetch('/api/actions?product=TIERRA'),
      ])
      const kpi: KpiResponse = await kpiRes.json()
      const actions: Action[] = await actionsRes.json()

      const now = new Date()
      const from = new Date(kpi.period.from)

      const generated = buildWeeklyPrompt({
        period: {
          start: from.toLocaleDateString('ja-JP'),
          end:   now.toLocaleDateString('ja-JP'),
        },
        product: 'tierra',
        kpiData: {
          revenue: {
            value:    kpi.lagging.revenue.value,
            target:   kpi.lagging.revenue.target,
            prevWeek: kpi.lagging.revenue.prevWeek ?? 0,
          },
          repeatRate: {
            value:    kpi.lagging.repeatRate.value,
            target:   kpi.lagging.repeatRate.target ?? 30,
            warning:  kpi.lagging.repeatRate.warning ?? 24,
            prevWeek: kpi.lagging.repeatRate.prevWeek ?? 0,
          },
          subscriptionRate: {
            value:    kpi.lagging.subscriptionRate.value,
            target:   kpi.lagging.subscriptionRate.target ?? 15,
            warning:  kpi.lagging.subscriptionRate.warning ?? 12,
            prevWeek: kpi.lagging.subscriptionRate.prevWeek ?? 0,
          },
          roas: {
            value:    kpi.lagging.roas.value,
            target:   kpi.lagging.roas.target ?? 300,
            warning:  kpi.lagging.roas.warning ?? 240,
            prevWeek: kpi.lagging.roas.prevWeek ?? 0,
          },
          cartAddRate: {
            value:    kpi.leading.cartAddRate.value,
            target:   kpi.leading.cartAddRate.target ?? 8,
            warning:  kpi.leading.cartAddRate.warning ?? 6.4,
            prevWeek: kpi.leading.cartAddRate.prevWeek ?? 0,
          },
          lineOpenRate: {
            value:    kpi.leading.lineOpenRate.value,
            target:   kpi.leading.lineOpenRate.target ?? 45,
            warning:  kpi.leading.lineOpenRate.warning ?? 36,
            prevWeek: kpi.leading.lineOpenRate.prevWeek ?? 0,
          },
        },
        recentActions: actions.slice(0, 5).map((a) => ({
          title:        a.title,
          status:       a.status,
          effectRating: a.effectRating,
        })),
        cohort: kpi.cohort,
      })

      setPrompt(generated)
    } finally {
      setGenerating(false)
    }
  }

  // クリップボードコピー
  async function handleCopy() {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // 保存
  async function handleSave() {
    if (!prompt || !pasteText) return
    setSaving(true)
    setSaveMsg('')
    try {
      let resultJson: string | null = null
      try {
        JSON.parse(pasteText)
        resultJson = pasteText
      } catch { /* not JSON */ }

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStart:  getMondayISO(new Date()),
          promptText: prompt,
          resultText: pasteText,
          resultJson,
        }),
      })

      if (res.ok) {
        setSaveMsg('保存しました ✓')
        setPasteText('')
        await fetchReports()
        setTimeout(() => setSaveMsg(''), 3000)
      } else {
        setSaveMsg('保存に失敗しました')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="AIレポート"
        subtitle="週次分析プロンプト生成・レポート管理"
      />

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* ─── 左カラム: プロンプト生成パネル ─── */}
          <div className="w-full lg:w-1/3 lg:shrink-0 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-900">プロンプト生成</h2>

              {/* 生成ボタン */}
              <button
                onClick={handleGenerate}
                disabled={generating}
                className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  generating
                    ? 'bg-emerald-300 text-white cursor-wait'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[.98]'
                }`}
              >
                {generating ? '生成中...' : '今週のプロンプトを生成'}
              </button>

              {/* プロンプト表示エリア */}
              <div className="relative">
                <button
                  onClick={handleCopy}
                  disabled={!prompt}
                  className={`absolute top-2 right-2 z-10 text-xs px-2 py-1 rounded transition-all ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                  } disabled:opacity-40 disabled:cursor-default`}
                >
                  {copied ? 'コピー済み ✓' : 'コピー'}
                </button>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  readOnly={!prompt}
                  placeholder="「今週のプロンプトを生成」をクリックするとここにプロンプトが表示されます"
                  className="w-full h-96 bg-slate-900 text-slate-100 font-mono text-xs p-3 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-slate-600 placeholder:text-slate-600"
                />
              </div>

              {/* Claude.ai リンク */}
              <a
                href="https://claude.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold bg-slate-800 text-slate-100 hover:bg-slate-700 transition-colors"
              >
                Claude.ai を開く →
              </a>

              {/* 結果ペーストエリア */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Claude.ai の回答をここに貼り付け
                </label>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder='{"summary": "...", "alerts": [...], "recommendations": [...]}'
                  className="w-full h-48 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-slate-300 placeholder:text-slate-300"
                />
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving || !prompt || !pasteText}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      saving
                        ? 'bg-slate-300 text-slate-500 cursor-wait'
                        : !prompt || !pasteText
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-900 text-white hover:bg-slate-700 active:scale-[.98]'
                    }`}
                  >
                    {saving ? '保存中...' : '保存する'}
                  </button>
                  {saveMsg && (
                    <span className="text-xs font-semibold text-emerald-600">{saveMsg}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ─── 右カラム: レポート履歴 ─── */}
          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                レポート履歴
                {reports.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-slate-400">{reports.length}件</span>
                )}
              </h2>
              <button
                onClick={fetchReports}
                className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
              >
                更新
              </button>
            </div>

            {!reportsLoaded ? (
              <p className="text-sm text-slate-400 text-center py-12">読み込み中...</p>
            ) : reports.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
                <p className="text-sm text-slate-400">
                  まだレポートがありません。
                  <br />
                  左のパネルからプロンプトを生成してください。
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((r) => (
                  <ReportCard key={r.id} report={r} onRefresh={fetchReports} />
                ))}
              </div>
            )}
          </div>
        </div>
    </div>
  )
}
