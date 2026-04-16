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

interface CohortPoint {
  cohortMonth: string
  totalBuyers: number
  repeaters: number
  repeatRatePct: number
}

interface CohortChartProps {
  data: CohortPoint[]
  height?: number
}

function formatXAxis(month: string) {
  // "2025-11" → "25/11"
  const parts = month.split('-')
  return `${parts[0].slice(2)}/${parts[1]}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as CohortPoint | undefined
  if (!d) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs space-y-1">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <p className="text-slate-500">購入者数: {d.totalBuyers} 人</p>
      <p className="text-slate-500">リピーター: {d.repeaters} 人</p>
      <p className="text-emerald-600 font-semibold">リピート率: {d.repeatRatePct}%</p>
    </div>
  )
}

export default function CohortChart({ data, height = 260 }: CohortChartProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-slate-900">
          コホート分析（初回購入60日以内リピート率）
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">購入月別のリピート率推移</p>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 10, right: 80, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="cohortMonth"
            tickFormatter={formatXAxis}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          {/* 左Y軸: 購入者数 */}
          <YAxis
            yAxisId="buyers"
            orientation="left"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          {/* 右Y軸: リピート率% */}
          <YAxis
            yAxisId="rate"
            orientation="right"
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: '#10b981' }}
            axisLine={false}
            tickLine={false}
            width={50}
            domain={[0, 50]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) =>
              value === 'totalBuyers' ? '購入者数' : 'リピート率'
            }
            wrapperStyle={{ fontSize: 12 }}
          />
          {/* 目標ライン 30% */}
          <ReferenceLine
            yAxisId="rate"
            y={30}
            stroke="#f59e0b"
            strokeDasharray="5 4"
            strokeWidth={1.5}
            label={{
              value: '目標 30%',
              position: 'right',
              fontSize: 10,
              fill: '#f59e0b',
            }}
          />
          {/* 警告ライン 24% */}
          <ReferenceLine
            yAxisId="rate"
            y={24}
            stroke="#fca5a5"
            strokeDasharray="4 3"
            strokeWidth={1.5}
            label={{
              value: '要注意 24%',
              position: 'right',
              fontSize: 10,
              fill: '#f87171',
            }}
          />
          {/* 購入者数 Bar */}
          <Bar
            yAxisId="buyers"
            dataKey="totalBuyers"
            fill="#cbd5e1"
            radius={[3, 3, 0, 0]}
            name="totalBuyers"
            maxBarSize={48}
          />
          {/* リピート率 Line */}
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="repeatRatePct"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={{ r: 5, fill: '#10b981', strokeWidth: 0 }}
            activeDot={{ r: 7 }}
            name="repeatRatePct"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
