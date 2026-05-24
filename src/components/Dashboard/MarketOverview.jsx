import { useEffect, useState } from 'react'
import { getGlobalMarket, getFearGreed } from '../../services/cryptoService'
import { formatMarketCap, formatNumber } from '../../utils/format'
import { TrendingUp, DollarSign, Activity, Zap } from 'lucide-react'

const Card = ({ icon: Icon, label, value, sub, iconColor }) => (
  <div className="glass-card rounded-xl p-4 flex items-center gap-4">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-gray-400 text-xs uppercase tracking-wider truncate">{label}</p>
      <p className="text-white font-bold text-lg font-mono leading-tight">{value}</p>
      {sub && <p className="text-gray-500 text-xs">{sub}</p>}
    </div>
  </div>
)

const FearGreedGauge = ({ value, label }) => {
  const pct = Math.min(100, Math.max(0, value))
  const color = pct >= 75 ? '#10b981' : pct >= 55 ? '#86efac' : pct >= 45 ? '#fbbf24' : pct >= 25 ? '#f97316' : '#ef4444'
  return (
    <div className="glass-card rounded-xl p-4">
      <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Fear & Greed Index</p>
      <div className="flex items-end gap-3">
        <div className="relative w-16 h-16">
          <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke={color} strokeWidth="3"
              strokeDasharray={`${pct} 100`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">{value}</span>
        </div>
        <div>
          <p className="font-bold text-lg" style={{ color }}>{label}</p>
          <p className="text-gray-500 text-xs">Market Sentiment</p>
        </div>
      </div>
    </div>
  )
}

export default function MarketOverview() {
  const [global, setGlobal] = useState(null)
  const [fg, setFg] = useState(null)

  useEffect(() => {
    getGlobalMarket().then(setGlobal).catch(() => {})
    getFearGreed().then((d) => setFg(d.data?.[0])).catch(() => {})
  }, [])

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">Market Overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {global && (
          <>
            <Card
              icon={DollarSign}
              label="Total Market Cap"
              value={formatMarketCap(global.total_market_cap?.usd)}
              sub={`${global.market_cap_change_percentage_24h_usd?.toFixed(1)}% 24h`}
              iconColor="bg-blue-500/30"
            />
            <Card
              icon={Activity}
              label="24h Volume"
              value={formatMarketCap(global.total_volume?.usd)}
              sub={`${global.active_cryptocurrencies?.toLocaleString()} active coins`}
              iconColor="bg-purple-500/30"
            />
            <Card
              icon={TrendingUp}
              label="BTC Dominance"
              value={`${global.market_cap_percentage?.btc?.toFixed(1)}%`}
              sub={`ETH: ${global.market_cap_percentage?.eth?.toFixed(1)}%`}
              iconColor="bg-orange-500/30"
            />
            <Card
              icon={Zap}
              label="Markets"
              value={global.markets?.toLocaleString() || 'N/A'}
              sub="Active exchanges"
              iconColor="bg-cyan-500/30"
            />
          </>
        )}
        {fg && <FearGreedGauge value={parseInt(fg.value)} label={fg.value_classification} />}
      </div>
    </div>
  )
}
