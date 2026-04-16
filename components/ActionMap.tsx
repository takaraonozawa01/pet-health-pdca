'use client'

import { useState } from 'react'

interface KpiValues {
  repeatRate:       { value: number; warning: number; alert: number }
  subscriptionRate: { value: number; warning: number; alert: number }
  roas:             { value: number; warning: number; alert: number }
  cartAddRate:      { value: number; warning: number; alert: number }
}

interface ActionCandidate {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  relatedKpi: string
}

interface RuleCard {
  id: string
  badgeColor: 'red' | 'amber'
  triggerLabel: string
  currentValue: number
  warningValue: number
  unit: string
  analyses: string[]
  actions: ActionCandidate[]
}

interface ActionMapProps {
  kpiData: KpiValues
}

const PRIORITY_LABEL: Record<string, string> = {
  high:   '優先度 高',
  medium: '優先度 中',
  low:    '優先度 低',
}

const PRIORITY_STYLE: Record<string, string> = {
  high:   'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low:    'bg-slate-100 text-slate-600',
}

function buildRules(kpi: KpiValues): RuleCard[] {
  const rules: RuleCard[] = []

  if (kpi.repeatRate.value < kpi.repeatRate.warning) {
    rules.push({
      id: 'repeat',
      badgeColor: 'red',
      triggerLabel: 'リピート率 低下',
      currentValue: kpi.repeatRate.value,
      warningValue: kpi.repeatRate.warning,
      unit: '%',
      analyses: [
        'GA4コホートで離脱タイミングを確認',
        '購入後30日・60日のLINE接触頻度を確認',
      ],
      actions: [
        {
          title: '購入後30日LINEフォロー強化',
          description: '購入後30日時点でのLINEリマインドメッセージを設計・配信する',
          priority: 'high',
          relatedKpi: 'repeat_rate',
        },
        {
          title: '使い方コンテンツをLINEで送付',
          description: 'TIERRAの正しい使い方・効果実感のタイミングを説明するコンテンツをLINEで配信',
          priority: 'high',
          relatedKpi: 'repeat_rate',
        },
        {
          title: '2回目購入限定クーポン設計',
          description: '初回購入者向けに2回目10%OFFクーポンをLINEで自動送付する仕組みを構築',
          priority: 'medium',
          relatedKpi: 'repeat_rate',
        },
      ],
    })
  }

  if (kpi.subscriptionRate.value < kpi.subscriptionRate.warning) {
    rules.push({
      id: 'subscription',
      badgeColor: 'red',
      triggerLabel: '定期転換率 低下',
      currentValue: kpi.subscriptionRate.value,
      warningValue: kpi.subscriptionRate.warning,
      unit: '%',
      analyses: [
        '定期購入ページの閲覧率をGA4で確認',
        '商品ページから定期購入ページへのCTRを確認',
      ],
      actions: [
        {
          title: '商品ページに定期購入訴求バナーを追加',
          description: '楽天・BASE・Yahoo各ショップの商品ページに定期購入プランへの誘導バナーを設置',
          priority: 'high',
          relatedKpi: 'subscription_rate',
        },
        {
          title: '定期購入メリットをLINEで訴求',
          description: '定期購入の価格メリット・解約自由を説明するLINEコンテンツを設計・配信',
          priority: 'high',
          relatedKpi: 'subscription_rate',
        },
        {
          title: '初月割引＋2回目特典の設計',
          description: '初回定期申込時の割引と2回目継続特典を設計し、定期転換の心理的ハードルを下げる',
          priority: 'medium',
          relatedKpi: 'subscription_rate',
        },
      ],
    })
  }

  if (kpi.roas.value < kpi.roas.warning) {
    rules.push({
      id: 'roas',
      badgeColor: 'amber',
      triggerLabel: 'ROAS 低下',
      currentValue: kpi.roas.value,
      warningValue: kpi.roas.warning,
      unit: '%',
      analyses: [
        'チャネル別ROASをGoogle広告管理画面で比較',
        'CVRが先に改善されているか確認（LP改善が先決）',
      ],
      actions: [
        {
          title: '広告クリエイティブABテスト実施',
          description: 'ClaudeでTIERRA広告コピーを10パターン生成し、Google P-MAXでABテストを開始',
          priority: 'high',
          relatedKpi: 'roas',
        },
        {
          title: '低ROASチャネルの予算削減',
          description: 'Instagram ROASが180%を下回っている場合、予算をGoogleに移行する',
          priority: 'medium',
          relatedKpi: 'roas',
        },
        {
          title: 'LP（商品ページ）のCVR改善',
          description: 'カート追加率・放棄率をGA4で確認し、商品画像・訴求文・価格表示を改善',
          priority: 'high',
          relatedKpi: 'cvr',
        },
      ],
    })
  }

  if (kpi.cartAddRate.value < kpi.cartAddRate.warning) {
    rules.push({
      id: 'cart',
      badgeColor: 'amber',
      triggerLabel: 'カート追加率 低下',
      currentValue: kpi.cartAddRate.value,
      warningValue: kpi.cartAddRate.warning,
      unit: '%',
      analyses: [
        '商品ページ滞在時間をGA4で確認（目標90秒以上）',
        'スマホでの商品ページ表示を実機確認',
      ],
      actions: [
        {
          title: '商品ページのメイン画像を刷新',
          description: '犬が実際に使用している場面の画像・動画をトップに配置し、訴求力を上げる',
          priority: 'high',
          relatedKpi: 'cart_add_rate',
        },
        {
          title: 'レビュー件数を増やすキャンペーン',
          description: '購入後にレビュー投稿を促すLINEメッセージを送付。レビュー数増加でCVR改善',
          priority: 'medium',
          relatedKpi: 'cart_add_rate',
        },
        {
          title: '商品説明文のSEO・訴求最適化',
          description: 'Claudeで競合分析→差別化訴求を含む商品説明文を再作成し、各ショップに反映',
          priority: 'low',
          relatedKpi: 'cart_add_rate',
        },
      ],
    })
  }

  return rules
}

// ─── ActionCard: ボタン状態を持つ個別カード ───
function ActionCard({ action }: { action: ActionCandidate }) {
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
          title: action.title,
          description: action.description,
          priority: action.priority,
          status: 'proposed',
          relatedKpi: action.relatedKpi,
          dueDate: null,
        }),
      })
      if (res.ok) setAdded(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[action.priority]}`}>
              {PRIORITY_LABEL[action.priority]}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-900 leading-snug">{action.title}</p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{action.description}</p>
        </div>
      </div>
      <button
        onClick={handleAdd}
        disabled={added || loading}
        className={`w-full text-xs font-semibold py-2 rounded-lg transition-all ${
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

// ─── RuleCardPanel ───
function RuleCardPanel({ rule }: { rule: RuleCard }) {
  const badgeClass =
    rule.badgeColor === 'red'
      ? 'bg-red-100 text-red-700 border border-red-200'
      : 'bg-amber-100 text-amber-700 border border-amber-200'

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 border-b border-slate-200">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeClass}`}>
          {rule.badgeColor === 'red' ? '🔴' : '🟡'} {rule.triggerLabel}
        </span>
        <span className="text-xs text-slate-500">
          現在 {rule.currentValue}{rule.unit} ／ 要注意ライン {rule.warningValue}{rule.unit}
        </span>
      </div>

      {/* ボディ: 2カラム */}
      <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        {/* 左: 分析観点 */}
        <div className="lg:col-span-2 p-5 bg-slate-50/50">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            📊 分析観点
          </p>
          <ul className="space-y-2">
            {rule.analyses.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                <span className="mt-0.5 text-slate-400 shrink-0">・</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 右: アクション候補 */}
        <div className="lg:col-span-3 p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            推奨アクション
          </p>
          <div className="space-y-3">
            {rule.actions.map((action, i) => (
              <ActionCard key={i} action={action} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ActionMap（メインエクスポート）───
export default function ActionMap({ kpiData }: ActionMapProps) {
  const rules = buildRules(kpiData)

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-900">
          アクション連鎖マップ
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          KPI閾値割れを起点とした分析→アクション候補の自動展開
        </p>
      </div>

      <div className="p-6 space-y-5">
        {rules.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-6 py-5 text-center">
            <p className="text-emerald-700 font-semibold text-sm">
              ✅ すべてのKPIが目標ラインを上回っています
            </p>
            <p className="text-emerald-600 text-xs mt-1">
              現時点でアクションは不要です。引き続きモニタリングを続けてください。
            </p>
          </div>
        ) : (
          rules.map((rule) => <RuleCardPanel key={rule.id} rule={rule} />)
        )}
      </div>
    </div>
  )
}
