import { useEffect, useMemo, useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, Legend } from 'recharts'
import { getStockHistory } from '../services/stockService'
import { getCoinChart, getCoinMarkets } from '../services/cryptoService'
import { forecastPrices } from '../services/predictorService'
import LoadingSpinner from '../components/Common/LoadingSpinner'
import { formatPrice } from '../utils/format'
import { getPopularStocks } from '../services/stockService'
import { getPredictorConfig } from '../config/predictorConfig'

const toSeries = (rows = []) => rows.map((row) => ({
  date: row.date,
  close: Number(row.close),
  high: Number(row.high ?? row.close),
  low: Number(row.low ?? row.close),
  volume: Number(row.volume ?? 0),
}))

const fromCoinChart = (chart = {}) => {
  const prices = chart.prices || []
  const vols = chart.total_volumes || []
  return prices.map(([ts, close], idx) => ({
    date: new Date(ts).toISOString().split('T')[0],
    close: Number(close),
    high: Number(close),
    low: Number(close),
    volume: Number(vols[idx]?.[1] || 0),
  }))
}

const MetricCard = ({ title, value, tone = 'text-white', subtitle }) => (
  <div className="glass-card rounded-xl p-4">
    <p className="text-xs text-gray-500">{title}</p>
    <p className={`mt-1 text-xl font-semibold ${tone}`}>{value}</p>
    {subtitle && <p className="text-[11px] text-gray-500 mt-1">{subtitle}</p>}
  </div>
)

export default function ModelPerformance() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      try {
        const config = getPredictorConfig()
        const stockCandidates = getPopularStocks()
          .slice(0, config.modelLabStockCount)
          .map((s) => ({ key: s.symbol, label: s.symbol, type: 'stock' }))

        const coinMarkets = await getCoinMarkets(1, config.modelLabCryptoCount)
        const cryptoCandidates = coinMarkets
          .slice(0, config.modelLabCryptoCount)
          .map((c) => ({ key: c.id, label: c.symbol?.toUpperCase() || c.id, type: 'crypto' }))

        const assets = [...stockCandidates, ...cryptoCandidates]

        const evaluated = await Promise.all(assets.map(async (asset) => {
          if (asset.type === 'stock') {
            const history = await getStockHistory(asset.key, 'compact')
            const forecast = forecastPrices({ history: toSeries(history), horizonDays: config.defaultHorizonDays, assetClass: 'stock' })
            return { asset, forecast }
          }

          const chart = await getCoinChart(asset.key, 90)
          const forecast = forecastPrices({ history: fromCoinChart(chart), horizonDays: config.defaultHorizonDays, assetClass: 'crypto' })
          return { asset, forecast }
        }))

        if (!mounted) return

        const valid = evaluated
          .filter((row) => row.forecast?.ready)
          .map((row) => ({
            asset: row.asset.label,
            type: row.asset.type,
            hitRate: row.forecast.summary.expectedDirectionalSuccessPct,
            confidence: row.forecast.summary.confidenceScore,
            reliability: row.forecast.summary.reliabilityPct,
            mape: row.forecast.metrics.mape || 0,
            weightedHitRate: row.forecast.summary.weightedBacktestHitRatePct || 0,
            calibratedReturn: row.forecast.summary.calibratedExpectedReturn,
            regime: row.forecast.summary.volatilityRegime,
            backtests: row.forecast.multiHorizonBacktest,
          }))

        setRows(valid)
      } catch (_) {
        setRows([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  const aggregate = useMemo(() => {
    if (!rows.length) {
      return {
        avgHitRate: 0,
        avgReliability: 0,
        avgMape: 0,
      }
    }

    return {
      avgHitRate: rows.reduce((acc, row) => acc + row.hitRate, 0) / rows.length,
      avgReliability: rows.reduce((acc, row) => acc + row.reliability, 0) / rows.length,
      avgMape: rows.reduce((acc, row) => acc + row.mape, 0) / rows.length,
    }
  }, [rows])

  const horizonChart = useMemo(() => {
    const map = new Map()
    rows.forEach((row) => {
      row.backtests?.forEach((bt) => {
        if (!bt.sampleSize) return
        const key = `${bt.horizonDays}D`
        const existing = map.get(key) || { horizon: key, hitRate: 0, mape: 0, n: 0 }
        existing.hitRate += bt.directionalAccuracy || 0
        existing.mape += bt.mape || 0
        existing.n += 1
        map.set(key, existing)
      })
    })

    return [...map.values()].map((row) => ({
      horizon: row.horizon,
      hitRate: row.n ? row.hitRate / row.n : 0,
      mape: row.n ? row.mape / row.n : 0,
    }))
  }, [rows])

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner text="Evaluating model performance..." />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-screen-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Model Performance Lab</h1>
        <p className="text-gray-400 text-sm">Walk-forward validation across stocks and crypto with multi-horizon diagnostics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Average Expected Hit Rate" value={`${formatPrice(aggregate.avgHitRate, 1)}%`} tone="text-emerald-300" subtitle="Probability-weighted direction success" />
        <MetricCard title="Average Reliability" value={`${formatPrice(aggregate.avgReliability, 1)}%`} tone="text-cyan-300" subtitle="Combines hit rate and error profile" />
        <MetricCard title="Average MAPE" value={`${formatPrice(aggregate.avgMape, 2)}%`} tone="text-amber-300" subtitle="Lower is better" />
      </div>

      <div className="glass-card rounded-xl p-4">
        <h2 className="text-white font-semibold mb-3">Asset-Level Metrics</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="asset" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="hitRate" fill="#34d399" name="Expected Hit Rate %" />
              <Bar dataKey="confidence" fill="#38bdf8" name="Model Confidence" />
              <Bar dataKey="reliability" fill="#a78bfa" name="Reliability %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4">
        <h2 className="text-white font-semibold mb-3">Multi-Horizon Backtest Calibration</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={horizonChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="horizon" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="hitRate" name="Directional Hit Rate %" stroke="#34d399" strokeWidth={2} />
              <Line type="monotone" dataKey="mape" name="MAPE %" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4">
        <h2 className="text-white font-semibold mb-3">Current Evaluation Snapshot</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rows.map((row) => (
            <div key={row.asset} className="rounded-lg bg-white/5 border border-white/10 p-3 text-xs">
              <p className="text-white font-semibold">{row.asset} <span className="text-gray-500">({row.type})</span></p>
              <p className="text-gray-400 mt-1">Regime: <span className="text-gray-200">{row.regime}</span></p>
              <p className="text-gray-400">Weighted Hit Rate: <span className="text-emerald-300">{formatPrice(row.weightedHitRate, 1)}%</span></p>
              <p className="text-gray-400">Calibrated Return: <span className={row.calibratedReturn >= 0 ? 'text-emerald-300' : 'text-red-300'}>{row.calibratedReturn >= 0 ? '+' : ''}{formatPrice(row.calibratedReturn, 2)}%</span></p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
