import { getUpcomingIPOs } from '../services/stockService'
import { Calendar, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react'

const RiskBadge = ({ level }) => {
  const color = {
    'Low': 'text-green-400 bg-green-400/10 border-green-400/20',
    'Low-Medium': 'text-green-400 bg-green-400/10 border-green-400/20',
    'Medium': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    'Medium-High': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    'High': 'text-red-400 bg-red-400/10 border-red-400/20',
    'Very High': 'text-red-400 bg-red-400/10 border-red-400/20',
  }[level] || 'text-gray-400 bg-gray-400/10 border-gray-400/20'
  return <span className={`px-2 py-0.5 rounded border text-xs font-medium ${color}`}>{level} Risk</span>
}

const HypeBar = ({ value }) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <span className="text-gray-500 text-xs">Market Hype</span>
      <span className="text-white text-xs font-mono">{value}%</span>
    </div>
    <div className="w-full bg-white/5 rounded-full h-1.5">
      <div
        className={`h-1.5 rounded-full transition-all ${value >= 80 ? 'bg-orange-400' : value >= 60 ? 'bg-blue-400' : 'bg-gray-400'}`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
)

const IPO_TIPS = [
  'Wait 3–6 months post-IPO for price stabilization before entering',
  'Check the lock-up period (usually 90–180 days) — insider selling can pressure prices',
  'Compare IPO valuation to public market peers using P/S or EV/Revenue',
  'High hype ≠ good investment — many hyped IPOs trade below IPO price within 1 year',
  'Prioritize companies with a clear path to profitability over pure growth stories',
  'Allocate no more than 2–5% of portfolio to any single IPO position',
]

export default function IPO() {
  const ipos = getUpcomingIPOs()

  return (
    <div className="p-4 md:p-6 max-w-screen-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">IPO Calendar & Analysis</h1>
        <p className="text-gray-400 text-sm">Upcoming listings · Valuation analysis · AI risk assessment</p>
      </div>

      {/* Tips Banner */}
      <div className="glass-card rounded-xl p-5 border-blue-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Info size={16} className="text-blue-400" />
          <h3 className="text-blue-300 font-semibold text-sm">IPO Investing Tips</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {IPO_TIPS.map((tip, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
              <span className="text-blue-400 shrink-0 mt-0.5">→</span>
              {tip}
            </div>
          ))}
        </div>
      </div>

      {/* IPO Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {ipos.map((ipo) => (
          <div key={ipo.ticker} className="glass-card rounded-xl p-5 hover:border-white/15 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-white font-black text-sm">
                    {ipo.ticker.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{ipo.company}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-300 font-mono text-xs">{ipo.ticker}</span>
                      <span className="text-gray-500 text-xs">·</span>
                      <span className="text-gray-400 text-xs">{ipo.exchange}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
                  <Calendar size={10} />
                  {ipo.expectedDate}
                </div>
                <span className="text-white font-bold text-sm">{ipo.valuation}</span>
                <p className="text-gray-500 text-xs">Est. Valuation</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-purple-300 text-xs bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">{ipo.sector}</span>
              <RiskBadge level={ipo.riskLevel} />
            </div>

            <p className="text-gray-400 text-sm mb-4 leading-relaxed">{ipo.description}</p>

            <HypeBar value={ipo.hype} />

            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                {[
                  {
                    icon: <CheckCircle size={14} className="text-green-400" />,
                    label: 'Monitor',
                    color: 'text-green-400',
                    action: ipo.hype >= 80 ? 'Watch List' : 'Track',
                  },
                  {
                    icon: <TrendingUp size={14} className="text-blue-400" />,
                    label: 'Strategy',
                    color: 'text-blue-400',
                    action: ipo.hype >= 80 ? 'Post-IPO Entry' : 'IPO Day Entry',
                  },
                  {
                    icon: <AlertTriangle size={14} className="text-yellow-400" />,
                    label: 'Risk',
                    color: 'text-yellow-400',
                    action: ipo.riskLevel,
                  },
                ].map(({ icon, label, color, action }) => (
                  <div key={label} className="bg-white/5 rounded-lg p-2">
                    <div className="flex justify-center mb-1">{icon}</div>
                    <p className="text-gray-500 text-[10px]">{label}</p>
                    <p className={`${color} font-medium text-[10px]`}>{action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="text-center text-gray-600 text-xs py-4">
        ⚠️ IPO data is for educational purposes only. Expected dates and valuations are estimates and subject to change. Always consult a financial advisor before investing.
      </div>
    </div>
  )
}
