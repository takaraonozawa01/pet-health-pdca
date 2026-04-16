export interface PromptInput {
  period: { start: string; end: string }
  product: 'tierra' | 'nmn' | 'suiso' | 'all'
  kpiData: {
    revenue:          { value: number; target: number | null; prevWeek: number }
    repeatRate:       { value: number; target: number; warning: number; prevWeek: number }
    subscriptionRate: { value: number; target: number; warning: number; prevWeek: number }
    roas:             { value: number; target: number; warning: number; prevWeek: number }
    cartAddRate:      { value: number; target: number; warning: number; prevWeek: number }
    lineOpenRate:     { value: number; target: number; warning: number; prevWeek: number }
  }
  recentActions: Array<{
    title: string
    status: string
    effectRating: string | null
  }>
  cohort: Array<{
    cohortMonth: string
    repeatRatePct: number
  }>
}

function fmtDiff(value: number, prev: number): string {
  if (prev === 0) return '—'
  const diff = ((value - prev) / prev) * 100
  const sign = diff >= 0 ? '+' : ''
  return `${sign}${diff.toFixed(1)}%`
}

function kpiStatus(value: number, target: number, warning: number): string {
  if (value >= target)  return '達成'
  if (value >= warning) return '要注意'
  return '警告'
}

export function buildWeeklyPrompt(input: PromptInput): string {
  const { period, kpiData: k, recentActions, cohort } = input

  // 前週比
  const revDiff  = fmtDiff(k.revenue.value,          k.revenue.prevWeek)
  const repDiff  = fmtDiff(k.repeatRate.value,        k.repeatRate.prevWeek)
  const subDiff  = fmtDiff(k.subscriptionRate.value,  k.subscriptionRate.prevWeek)
  const roasDiff = fmtDiff(k.roas.value,              k.roas.prevWeek)
  const cartDiff = fmtDiff(k.cartAddRate.value,       k.cartAddRate.prevWeek)
  const lineDiff = fmtDiff(k.lineOpenRate.value,      k.lineOpenRate.prevWeek)

  // 状態
  const repStatus  = kpiStatus(k.repeatRate.value,       k.repeatRate.target,       k.repeatRate.warning)
  const subStatus  = kpiStatus(k.subscriptionRate.value, k.subscriptionRate.target, k.subscriptionRate.warning)
  const roasStatus = kpiStatus(k.roas.value,             k.roas.target,             k.roas.warning)
  const cartStatus = kpiStatus(k.cartAddRate.value,      k.cartAddRate.target,      k.cartAddRate.warning)
  const lineStatus = kpiStatus(k.lineOpenRate.value,     k.lineOpenRate.target,     k.lineOpenRate.warning)

  // コホート直近3件
  const recentCohort = cohort.slice(-3)
  const cohortLines = recentCohort
    .map((c) => `  - ${c.cohortMonth}: ${c.repeatRatePct}%`)
    .join('\n')

  // アクション
  const actionLines =
    recentActions.length === 0
      ? '  - 直近のアクションはありません'
      : recentActions
          .map((a) => {
            const rating = a.effectRating ? ` [効果: ${a.effectRating}]` : ''
            return `  - ${a.title}（${a.status}）${rating}`
          })
          .join('\n')

  return `# ペットヘルスケアEC 週次マーケティング分析

## 分析期間
${period.start} 〜 ${period.end}

## 対象商品
TIERRA（犬用歯周病ケア）
ペルソナ：愛犬の口臭が気になる・歯磨きを苦手とする飼い主（30〜50代）
収益モデル：消耗品の定期購入モデル（リピート率・定期転換率が利益の核）

## 今週のKPIデータ
| 指標 | 今週 | 目標 | 要注意ライン | 前週比 | 状態 |
|------|------|------|-------------|--------|------|
| 月間売上 | ¥${k.revenue.value.toLocaleString()} | — | — | ${revDiff} | — |
| リピート率（60日）| ${k.repeatRate.value}% | ${k.repeatRate.target}% | ${k.repeatRate.warning}% | ${repDiff} | ${repStatus} |
| 定期転換率 | ${k.subscriptionRate.value}% | ${k.subscriptionRate.target}% | ${k.subscriptionRate.warning}% | ${subDiff} | ${subStatus} |
| ROAS | ${k.roas.value}% | ${k.roas.target}% | ${k.roas.warning}% | ${roasDiff} | ${roasStatus} |
| カート追加率 | ${k.cartAddRate.value}% | ${k.cartAddRate.target}% | ${k.cartAddRate.warning}% | ${cartDiff} | ${cartStatus} |
| LINE開封率 | ${k.lineOpenRate.value}% | ${k.lineOpenRate.target}% | ${k.lineOpenRate.warning}% | ${lineDiff} | ${lineStatus} |

## コホート状況（直近3ヶ月）
${cohortLines}

## 直近実施アクション
${actionLines}

## 分析依頼
以下の観点で分析し、必ず下記のJSON形式のみで回答してください。
前置き・後書き・マークダウンの\`\`\`は不要です。JSONのみを出力してください。

{
  "summary": "今週の総評（150字以内）",
  "alerts": [
    {
      "kpi": "repeat_rate",
      "level": "warning",
      "reason": "この指標が悪化している原因の仮説（60字以内）"
    }
  ],
  "recommendations": [
    {
      "priority": 1,
      "title": "アクション名（20字以内）",
      "detail": "具体的な施策内容（80字以内）",
      "relatedKpi": "repeat_rate",
      "effort": "low"
    }
  ]
}

recommendations は優先度順に3〜5件。
effort は "low"（1時間以内）/ "medium"（半日）/ "high"（1日以上）で判定。`
}
