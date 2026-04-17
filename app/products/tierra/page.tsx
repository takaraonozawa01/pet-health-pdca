import KpiCard from '@/components/KpiCard'
import KpiGauge from '@/components/KpiGauge'
import FormulaTree from '@/components/FormulaTree'
import KpiTrendChart from '@/components/charts/KpiTrendChart'
import CohortChart from '@/components/charts/CohortChart'
import ActionMap from '@/components/ActionMap'
import PageHeader from '@/components/PageHeader'
import { getKpiData } from '@/lib/kpi'

import type { KpiData, KpiMetric } from '@/lib/kpi'

type Status = 'ok' | 'warning' | 'alert' | 'neutral'

function getStatus(metric: KpiMetric): Status {
  if (metric.target === null) return 'neutral'
  if (metric.alert !== null && metric.value < metric.alert) return 'alert'
  if (metric.warning !== null && metric.value < metric.warning) return 'alert'
  if (metric.warning !== null && metric.value < metric.target) return 'warning'
  return 'ok'
}

const NAV_ITEMS = [
  { href: '#gauge',      label: 'ゲージ' },
  { href: '#leading',    label: '先行指標' },
  { href: '#formula',    label: '因数分解' },
  { href: '#trend',      label: 'トレンド' },
  { href: '#cohort',     label: 'コホート' },
  { href: '#action-map', label: 'アクション' },
]

export default async function TierraPage() {
  const data = await getKpiData('TIERRA', 60)

  const { lagging, leading, revenueTrend, adTrend, cohort } = data

  const recent4Weeks = revenueTrend.slice(-4)
  const newRevenue = recent4Weeks.reduce((s, w) => s + w.newRevenue, 0)
  const returningRevenue = recent4Weeks.reduce((s, w) => s + w.returningRevenue, 0)
  const totalRevenue = newRevenue + returningRevenue
  const newRatio = totalRevenue > 0 ? Math.round((newRevenue / totalRevenue) * 100) : 0
  const returningRatio = 100 - newRatio

  const adByWeek = new Map(adTrend.map((d) => [d.weekStart.slice(0, 10), d.roas]))
  const trendData = revenueTrend.map((w) => ({
    weekStart: w.weekStart,
    revenue: w.revenue,
    roas: adByWeek.get(w.weekStart.slice(0, 10)) ?? 0,
  }))

  return (
    <div className="space-y-8">
      <PageHeader
        title="TIERRA 詳細KPI"
        subtitle="歯周病ケア ／ リピート収益モデル"
      />

      {/* セクション内ナビゲーション */}
      <nav className="flex items-center gap-2 flex-wrap">
        {NAV_ITEMS.map(({ href, label }) => (
          <a
            key={href}
            href={href}
            className="px-4 py-1.5 rounded-full text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors shadow-sm"
          >
            {label}
          </a>
        ))}
      </nav>

      {/* ─── セクション1: 遅効指標ゲージ ─── */}
      <section id="gauge">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          遅効指標（Lagging KPIs）
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <KpiGauge
            label="リピート率（60日）"
            value={lagging.repeatRate.value}
            target={lagging.repeatRate.target ?? 30}
            unit="%"
            status={getStatus(lagging.repeatRate)}
            description="初回購入から60日以内に再購入した顧客の割合"
            warning={lagging.repeatRate.warning ?? undefined}
            alert={lagging.repeatRate.alert ?? undefined}
          />
          <KpiGauge
            label="定期転換率"
            value={lagging.subscriptionRate.value}
            target={lagging.subscriptionRate.target ?? 15}
            unit="%"
            status={getStatus(lagging.subscriptionRate)}
            description="全購入者のうち定期購入に転換した顧客の割合"
            warning={lagging.subscriptionRate.warning ?? undefined}
            alert={lagging.subscriptionRate.alert ?? undefined}
          />
          <KpiGauge
            label="ROAS（広告全体）"
            value={lagging.roas.value}
            target={lagging.roas.target ?? 300}
            unit="%"
            status={getStatus(lagging.roas)}
            description="広告費用対効果（全チャネル平均）"
            warning={lagging.roas.warning ?? undefined}
            alert={lagging.roas.alert ?? undefined}
          />
          <KpiGauge
            label="月間売上"
            value={lagging.revenue.value}
            target={0}
            unit="円"
            status="neutral"
            description="直近60日間の総売上金額"
          />
        </div>
      </section>

      {/* ─── セクション2: 先行指標 ─── */}
      <section id="leading">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          先行指標（Leading KPIs）
        </h2>
        <div className="flex flex-col md:flex-row gap-6">
          {/* 左: 購買導線指標 */}
          <div className="flex-1 space-y-3">
            <p className="text-xs font-medium text-slate-500 px-1">購買導線指標</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <KpiCard
                label="カート追加率"
                value={`${leading.cartAddRate.value}%`}
                target={`目標 ${leading.cartAddRate.target}%`}
                status={getStatus(leading.cartAddRate)}
              />
              <KpiCard
                label="LINE 開封率"
                value={`${leading.lineOpenRate.value}%`}
                target={`目標 ${leading.lineOpenRate.target}%`}
                status={getStatus(leading.lineOpenRate)}
              />
            </div>
          </div>

          {/* 右: 広告・SNS指標 */}
          <div className="flex-1 space-y-3">
            <p className="text-xs font-medium text-slate-500 px-1">広告・SNS指標（参考値）</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-400 mb-1">Google ROAS</p>
                <p className="text-2xl font-bold text-slate-900">{leading.googleRoas.value}%</p>
                <p className="text-xs text-slate-400 mt-1">直近週</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-400 mb-1">Instagram ROAS</p>
                <p className="text-2xl font-bold text-slate-900">{leading.igRoas.value}%</p>
                <p className="text-xs text-slate-400 mt-1">直近週</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-400 mb-1">IG リーチ</p>
                <p className="text-2xl font-bold text-slate-900">
                  {leading.igReach.value.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-1">直近週</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-400 mb-1">IG 保存数</p>
                <p className="text-2xl font-bold text-slate-900">
                  {leading.igSaves.value.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-1">直近週</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── セクション3: 因数分解 ─── */}
      <section id="formula">
        <FormulaTree
          totalRevenue={totalRevenue}
          newRevenue={newRevenue}
          returningRevenue={returningRevenue}
          newRatio={newRatio}
          returningRatio={returningRatio}
          repeatRate={lagging.repeatRate.value}
        />
      </section>

      {/* ─── セクション4: KPIトレンドグラフ ─── */}
      <section id="trend">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-slate-900">KPI トレンド（過去8週）</h2>
            <p className="text-xs text-slate-400 mt-0.5">週次売上（棒）と ROAS（折れ線）の推移</p>
          </div>
          <KpiTrendChart data={trendData} height={280} roasTarget={300} />
        </div>
      </section>

      {/* ─── セクション5: コホートグラフ ─── */}
      <section id="cohort">
        <CohortChart data={cohort} height={260} />
      </section>

      {/* ─── セクション6: アクション連鎖マップ ─── */}
      <section id="action-map">
        <ActionMap
          kpiData={{
            repeatRate: {
              value:   lagging.repeatRate.value,
              warning: lagging.repeatRate.warning ?? 24,
              alert:   lagging.repeatRate.alert   ?? 18,
            },
            subscriptionRate: {
              value:   lagging.subscriptionRate.value,
              warning: lagging.subscriptionRate.warning ?? 12,
              alert:   lagging.subscriptionRate.alert   ?? 9,
            },
            roas: {
              value:   lagging.roas.value,
              warning: lagging.roas.warning ?? 240,
              alert:   lagging.roas.alert   ?? 180,
            },
            cartAddRate: {
              value:   leading.cartAddRate.value,
              warning: leading.cartAddRate.warning ?? 6.4,
              alert:   leading.cartAddRate.alert   ?? 4.8,
            },
          }}
        />
      </section>
    </div>
  )
}
