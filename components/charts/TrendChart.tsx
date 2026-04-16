'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface TrendPoint {
  weekStart: string
  newRevenue: number
  returningRevenue: number
}

interface TrendChartProps {
  data: TrendPoint[]
  height?: number
}

function formatXAxis(iso: string) {
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd}`
}

function formatYAxis(value: number) {
  if (value >= 1000) return `¥${Math.round(value / 1000)}k`
  return `¥${value}`
}

function formatTooltip(value: number | string | undefined, name: string) {
  const label = name === 'newRevenue' ? '新規売上' : 'リピート売上'
  const num = typeof value === 'number' ? value : Number(value ?? 0)
  return [`¥${num.toLocaleString()}`, label]
}

export default function TrendChart({ data, height = 300 }: TrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="colorReturning" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="weekStart"
          tickFormatter={formatXAxis}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          width={55}
        />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={formatTooltip as any}
          labelFormatter={(label) => `週: ${formatXAxis(label as string)}`}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
        />
        <Legend
          formatter={(value) => (value === 'newRevenue' ? '新規売上' : 'リピート売上')}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Area
          type="monotone"
          dataKey="returningRevenue"
          stackId="1"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#colorReturning)"
          name="returningRevenue"
        />
        <Area
          type="monotone"
          dataKey="newRevenue"
          stackId="1"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#colorNew)"
          name="newRevenue"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
