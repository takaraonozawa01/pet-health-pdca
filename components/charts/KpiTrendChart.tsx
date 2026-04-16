'use client'

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'

interface TrendPoint {
  weekStart: string
  revenue: number
  roas: number
}

interface KpiTrendChartProps {
  data: TrendPoint[]
  height?: number
  roasTarget?: number
}

function formatXAxis(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function formatRevenue(v: number) {
  if (v >= 1000) return `¥${Math.round(v / 1000)}k`
  return `¥${v}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs space-y-1">
      <p className="font-semibold text-slate-600 mb-1">週: {formatXAxis(label)}</p>
      {payload.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (entry: any) =>
          entry.value != null && (
            <p key={entry.dataKey} style={{ color: entry.color }}>
              {entry.dataKey === 'revenue'
                ? `売上: ¥${entry.value.toLocaleString()}`
                : `ROAS: ${entry.value}%`}
            </p>
          )
      )}
    </div>
  )
}

export default function KpiTrendChart({ data, height = 280, roasTarget = 300 }: KpiTrendChartProps) {
  const recent8 = data.slice(-8)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={recent8} margin={{ top: 10, right: 60, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="weekStart"
          tickFormatter={formatXAxis}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        {/* 左Y軸: 売上 */}
        <YAxis
          yAxisId="revenue"
          orientation="left"
          tickFormatter={formatRevenue}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          width={55}
        />
        {/* 右Y軸: ROAS */}
        <YAxis
          yAxisId="roas"
          orientation="right"
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 11, fill: '#f59e0b' }}
          axisLine={false}
          tickLine={false}
          width={50}
          domain={[0, Math.max(roasTarget * 1.2, 400)]}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (value === 'revenue' ? '売上' : 'ROAS')}
          wrapperStyle={{ fontSize: 12 }}
        />
        {/* ROAS目標ライン */}
        <ReferenceLine
          yAxisId="roas"
          y={roasTarget}
          stroke="#f87171"
          strokeDasharray="5 4"
          strokeWidth={1.5}
          label={{ value: `目標 ${roasTarget}%`, position: 'right', fontSize: 10, fill: '#f87171' }}
        />
        {/* 売上Bar */}
        <Bar
          yAxisId="revenue"
          dataKey="revenue"
          fill="#94a3b8"
          radius={[3, 3, 0, 0]}
          name="revenue"
          maxBarSize={40}
        />
        {/* ROAS Line */}
        <Line
          yAxisId="roas"
          type="monotone"
          dataKey="roas"
          stroke="#f59e0b"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
          activeDot={{ r: 6 }}
          name="roas"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
