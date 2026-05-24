import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { useState } from 'react'

const RANGES = [
  { label: '1D', days: 1 },
  { label: '7D', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
]

const CustomTooltip = ({ active, payload, label, prefix = '$' }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dark-800 border border-white/10 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-mono font-semibold">
          {prefix}{parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
        </p>
      ))}
    </div>
  )
}

export default function PriceChart({ data = [], color = '#3b82f6', prefix = '$', onRangeChange, title }) {
  const [range, setRange] = useState(7)

  const isPositive = data.length >= 2 && data[data.length - 1]?.close >= data[0]?.close
  const lineColor = isPositive ? '#10b981' : '#ef4444'
  const gradientId = `grad-${Math.random().toString(36).slice(2, 7)}`

  const formatted = data.map((d) => ({
    ...d,
    value: d.close || d.price || d.value || 0,
    label: d.date
      ? new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : d.label || '',
  }))

  const handleRange = (days) => {
    setRange(days)
    onRangeChange?.(days)
  }

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-600 text-sm">
        No chart data available
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        {title && <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{title}</span>}
        <div className="flex gap-1 ml-auto">
          {RANGES.map(({ label, days }) => (
            <button
              key={label}
              onClick={() => handleRange(days)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                range === days
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={formatted} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${prefix}${v.toLocaleString()}`}
            width={70}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip prefix={prefix} />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: lineColor }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SparklineChart({ data = [], color = '#3b82f6', height = 50 }) {
  const values = data.map((d, i) => ({ v: d, i }))
  const isPos = values.length >= 2 && values[values.length - 1].v >= values[0].v
  const c = isPos ? '#10b981' : '#ef4444'
  const gid = `spark-${Math.random().toString(36).slice(2, 7)}`

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={values} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity={0.3} />
            <stop offset="100%" stopColor={c} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={c} strokeWidth={1.5} fill={`url(#${gid})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
