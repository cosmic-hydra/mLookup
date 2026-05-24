import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts'
import { BrainCircuit, ShieldCheck, Sigma } from 'lucide-react'
import { forecastPrices } from '../../services/predictorService'
import { formatPrice } from '../../utils/format'
import PriceChange from '../Common/PriceChange'
import { getPredictorConfig } from '../../config/predictorConfig'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-dark-800/95 border border-white/10 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-2">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="font-mono" style={{ color: item.color }}>
          {item.name}: ${formatPrice(item.value, 4)}
        </p>
      ))}
    </div>
  )
}

export default function PredictorCard({ assetName, history = [], currentPrice, isSimulated = false, assetClass = 'mixed' }) {
  const config = getPredictorConfig()
  const [horizon, setHorizon] = useState(config.defaultHorizonDays)
  const [confidence, setConfidence] = useState(config.defaultConfidence)

  const result = useMemo(() => {
    return forecastPrices({
      history,
      horizonDays: horizon,
      confidence,
      currentPrice,
      assetClass,
    })
  }, [history, horizon, confidence, currentPrice, assetClass])

  if (!result.ready) {
    return (
      <div className="glass-card rounded-xl p-5 space-y-2">
        <div className="flex items-center gap-2 text-white">
          <BrainCircuit size={16} className="text-cyan-300" />
          <h3 className="font-semibold">Predictor Engine</h3>
        </div>
        <p className="text-gray-400 text-sm">{result.reason}</p>
      </div>
    )
  }

  const historicalTail = result.historical.slice(-30).map((point) => ({
    date: point.date,
    history: point.close,
    predicted: null,
    lower: null,
    upper: null,
  }))

  const forecastSeries = result.forecast.map((point) => ({
    date: point.date,
    history: null,
    predicted: point.predicted,
    lower: point.lower,
    upper: point.upper,
  }))

  const chartData = [...historicalTail, ...forecastSeries]

  return (
    <div className="glass-card rounded-xl p-5 space-y-4 border-cyan-500/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-white">
            <BrainCircuit size={16} className="text-cyan-300" />
            <h3 className="font-semibold">Predictor Engine</h3>
            <span className="text-[10px] uppercase tracking-wider text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
              {result.model}
            </span>
          </div>
          <p className="text-gray-400 text-xs mt-1">
            Forecast for {assetName} over {result.horizonDays} days
          </p>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-xs">Projected Price</p>
          <p className="text-white text-xl font-bold font-mono">
            ${formatPrice(result.summary.predictedPrice)}
          </p>
          <PriceChange value={result.summary.expectedReturn} size="sm" />
        </div>
      </div>

      {isSimulated && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-2.5 text-xs text-yellow-300">
          Prediction is based on simulated historical inputs. Add live API data for stronger forecasts.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {config.horizonOptions.map((days) => (
          <button
            key={days}
            onClick={() => setHorizon(days)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              horizon === days
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            {days}D
          </button>
        ))}
        {config.confidenceOptions.map((value) => (
          <button
            key={value}
            onClick={() => setConfidence(value)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              confidence === value
                ? 'bg-blue-500/20 text-blue-200 border border-blue-500/30'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            {Math.round(value * 100)}% CI
          </button>
        ))}
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${formatPrice(value, 2)}`}
              width={82}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={historicalTail[historicalTail.length - 1]?.date} stroke="rgba(148,163,184,0.5)" strokeDasharray="4 4" />

            <Area type="monotone" dataKey="upper" stroke="none" fill="rgba(56,189,248,0.16)" />
            <Area type="monotone" dataKey="lower" stroke="none" fill="rgba(11,15,32,0.75)" />

            <Line
              type="monotone"
              dataKey="history"
              name="Historical"
              stroke="#a78bfa"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="predicted"
              name="Forecast"
              stroke="#22d3ee"
              strokeWidth={2.2}
              dot={false}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="rounded-lg bg-white/5 p-2.5">
          <p className="text-gray-500">Confidence</p>
          <p className="text-white font-semibold mt-1 flex items-center gap-1">
            <ShieldCheck size={13} className="text-emerald-300" /> {result.summary.confidenceScore}/100
          </p>
        </div>
        <div className="rounded-lg bg-white/5 p-2.5">
          <p className="text-gray-500">Expected Hit Rate</p>
          <p className="text-white font-mono mt-1">{formatPrice(result.summary.expectedDirectionalSuccessPct, 1)}%</p>
        </div>
        <div className="rounded-lg bg-white/5 p-2.5">
          <p className="text-gray-500">Backtest MAPE</p>
          <p className="text-white font-mono mt-1">
            {result.metrics.mape === null ? 'N/A' : `${formatPrice(result.metrics.mape, 2)}%`}
          </p>
        </div>
        <div className="rounded-lg bg-white/5 p-2.5">
          <p className="text-gray-500">Daily Volatility</p>
          <p className="text-white font-mono mt-1">{formatPrice(result.summary.dailyVolatilityPct, 2)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg bg-white/5 p-2.5">
          <p className="text-gray-500">Direction Hit Rate</p>
          <p className="text-white font-semibold mt-1 flex items-center gap-1">
            <Sigma size={13} className="text-sky-300" />
            {result.metrics.directionalAccuracy === null
              ? 'N/A'
              : `${formatPrice(result.metrics.directionalAccuracy, 1)}%`}
          </p>
        </div>
        <div className="rounded-lg bg-white/5 p-2.5">
          <p className="text-gray-500">Model Blend</p>
          <p className="text-white font-mono mt-1">
            T {Math.round((result.summary.modelBlend?.trendWeight || 0.5) * 100)}%
            {' · '}
            R {Math.round((result.summary.modelBlend?.regimeWeight || 0.5) * 100)}%
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-white/5 p-2.5 text-xs text-gray-300">
        Regime: <span className="text-white">{result.summary.volatilityRegime}</span>
        {' · '}
        Calibrated Return: <span className={`font-semibold ${result.summary.calibratedExpectedReturn >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
          {result.summary.calibratedExpectedReturn >= 0 ? '+' : ''}{formatPrice(result.summary.calibratedExpectedReturn, 2)}%
        </span>
      </div>

      <p className="text-[11px] text-gray-500">
        Adaptive ensemble uses walk-forward model selection. Higher reliability improves odds, but no model guarantees returns.
      </p>
    </div>
  )
}
