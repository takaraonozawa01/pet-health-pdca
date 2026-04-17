import Link from 'next/link'
import KpiCard from '@/components/KpiCard'
import AlertBadge from '@/components/AlertBadge'
import TrendChart from '@/components/charts/TrendChart'
import PageHeader from '@/components/PageHeader'
import { getKpiData, getActionsData } from '@/lib/kpi'
import type { KpiMetric } from '@/lib/kpi'

type Status = 'ok' | 'warning' | 'alert' | 'neutral'

function getStatus(metric: KpiMetric): Status {
  if (metric.target === null) return 'neutral'
  if (metric.alert !== null && metric.value < metric.alert) return 'alert'
  if (metric.warning !== null && metric.value < metric.warning) return 'alert'
  if (metric.warning !== null && metric.value < metric.target) return 'warning'
  return 'ok'
}

function getCohortBadgeColor(pct: number) {
  if (pct >= 25) return 'bg-emerald-100 text-emerald-800'
  if (pct >= 15) return 'bg-amber-100 text-amber-800'
  return 'bg-red-100 text-red-800'
}

function getActionLevel(priority: string): 'ok' | 'warning' | 'alert' {
  if (priority === 'high') return 'alert'
  if (priority === 'medium') return 'warning'
  return 'ok'
}

export default async function DashboardPage() {
  const [kpi, actions] = await Promise.all([
    getKpiData('TIERRA', 60),
    getActionsData('TIERRA'),
  ])

  const { lagging, leading, cohort, revenueTrend } = kpi

  return (
    <div className="space-y-8">
      <PageHeader
        title="ダッシュボード"
        subtitle="全商品KPIサマリー"
        badge={{ text: 'TIERRA先行', color: 'emerald' }}
      />

      {/* ─── セクション1: 遅効指標 ─── */}
      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          遅効指標（Lagging KPIs）
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="月間売上"
            value={`¥${lagging.revenue.value.toLocaleString()}`}
            status="neutral"
          />
          <KpiCard
            label="リピート率（60日）"
            value={`${lagging.repeatRate.value}%`}
            target={`目標 ${lagging.repeatRate.target}%`}
            status={getStatus(lagging.repeatRate)}
          />
          <KpiCard
            label="定期転換率"
            value={`${lagging.subscriptionRate.value}%`}
            target={`目標 ${lagging.subscriptionRate.target}%`}
            status={getStatus(lagging.subscriptionRate)}
          />
          <KpiCard
            label="ROAS"
            value={`${lagging.roas.value}%`}
            target={`目標 ${lagging.roas.target}%`}
            status={getStatus(lagging.roas)}
          />
        </div>
      </section>

      {/* ─── セクション2: 売上トレンド ─── */}
      <section>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-slate-900">
              売上トレンド（週次・過去12週）
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">新規 / リピート別の積み上げ面グラフ</p>
          </div>
          <TrendChart data={revenueTrend} height={300} />
        </div>
      </section>

      {/* ─── セクション3: 先行指標 ─── */}
      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          先行指標（Leading KPIs）
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          <KpiCard
            label="Google ROAS（直近週）"
            value={`${leading.googleRoas.value}%`}
            status="neutral"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
              Instagram ROAS（直近週）
            </p>
            <p className="text-3xl font-bold text-slate-900">{leading.igRoas.value}%</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
              Instagram リーチ（直近週）
            </p>
            <p className="text-3xl font-bold text-slate-900">
              {leading.igReach.value.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
              Instagram 保存数（直近週）
            </p>
            <p className="text-3xl font-bold text-slate-900">
              {leading.igSaves.value.toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      {/* ─── セクション4: コホートテーブル ─── */}
      <section>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">
              コホート分析（初回購入から60日以内リピート率）
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">購入月別の顧客リピート状況</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">月</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">購入者数</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">リピーター</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">リピート率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cohort.map((row) => (
                  <tr key={row.cohortMonth} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-slate-900">{row.cohortMonth}</td>
                    <td className="px-6 py-3 text-right text-slate-600">{row.totalBuyers}</td>
                    <td className="px-6 py-3 text-right text-slate-600">{row.repeaters}</td>
                    <td className="px-6 py-3 text-right">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getCohortBadgeColor(row.repeatRatePct)}`}>
                        {row.repeatRatePct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── セクション5: アクション一覧 ─── */}
      <section>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">今週のアクション</h2>
            <Link href="/actions" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
              すべて見る →
            </Link>
          </div>
          {actions.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">今週のアクションはありません</p>
          ) : (
            <div className="space-y-2">
              {actions.slice(0, 5).map((action) => (
                <AlertBadge
                  key={action.id}
                  level={getActionLevel(action.priority)}
                  message={`[${action.relatedKpi}] ${action.title}`}
                />
              ))}
              {actions.length > 5 && (
                <p className="text-xs text-slate-400 text-center pt-2">他 {actions.length - 5} 件</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ─── セクション6: クイックリンク ─── */}
      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          クイックリンク
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { href: '/products/tierra', icon: '📊', title: 'TIERRA詳細KPI',    desc: 'ゲージ・グラフ・アクション連鎖マップ' },
            { href: '/reports',         icon: '📝', title: 'AIレポート生成',    desc: '週次分析プロンプトをワンクリック生成' },
            { href: '/actions',         icon: '✅', title: 'アクション管理',    desc: '提案・実行中・完了のKanbanボード' },
          ].map(({ href, icon, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex items-center gap-4 group"
            >
              <span className="text-2xl">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-900 group-hover:text-slate-700">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
              <span className="text-slate-300 group-hover:text-slate-500 transition-colors">→</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
