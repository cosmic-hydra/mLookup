import { getRecommendationStyle } from '../../utils/format'
import { Shield, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target, BarChart2 } from 'lucide-react'

const SignalBadge = ({ type, label, strength }) => {
  const config = {
    bullish: 'text-green-400 bg-green-400/10 border-green-400/20',
    bearish: 'text-red-400 bg-red-400/10 border-red-400/20',
    neutral: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  }[type]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium ${config}`}>
      {type === 'bullish' ? <TrendingUp size={10} /> : type === 'bearish' ? <TrendingDown size={10} /> : null}
      {label}
    </span>
  )
}

const ConfidenceBar = ({ value }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 bg-white/5 rounded-full h-2">
      <div
        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
    <span className="text-gray-300 text-xs font-mono w-8">{value}%</span>
  </div>
)

export default function AnalysisCard({ analysis, assetName }) {
  if (!analysis) return null

  const { recommendation, action, confidence, signalScore, riskLevel, signals, risks, opportunities, technicals, priceTargets, summary } = analysis
  const style = getRecommendationStyle(recommendation)

  const riskColor = {
    'Very High': 'text-red-400',
    'High': 'text-orange-400',
    'Medium-High': 'text-yellow-400',
    'Medium': 'text-blue-400',
    'Low': 'text-green-400',
    'Low-Medium': 'text-green-400',
  }[riskLevel] || 'text-gray-400'

  return (
    <div className="space-y-4">
      {/* Recommendation Banner */}
      <div className={`rounded-xl p-4 border ${style.bg} ${style.border}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">AI Recommendation</p>
            <p className={`text-3xl font-black ${style.text}`}>{action}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs mb-1">Signal Score</p>
            <p className={`text-2xl font-bold ${signalScore >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {signalScore >= 0 ? '+' : ''}{signalScore}
            </p>
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-xs mb-1.5">Confidence</p>
          <ConfidenceBar value={confidence} />
        </div>
      </div>

      {/* Summary */}
      <div className="glass-card rounded-xl p-4">
        <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Analysis Summary</p>
        <p className="text-gray-300 text-sm leading-relaxed">{summary}</p>
      </div>

      {/* Signals */}
      {signals?.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-3 flex items-center gap-1">
            <BarChart2 size={12} /> Technical Signals
          </p>
          <div className="flex flex-wrap gap-2">
            {signals.map((s, i) => (
              <SignalBadge key={i} type={s.type} label={s.label} strength={s.strength} />
            ))}
          </div>
        </div>
      )}

      {/* Price Targets */}
      {priceTargets && (
        <div className="glass-card rounded-xl p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-3 flex items-center gap-1">
            <Target size={12} /> Price Targets
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Stop Loss', value: priceTargets.stopLoss, color: 'text-red-400' },
              { label: 'Support', value: priceTargets.support, color: 'text-orange-400' },
              { label: 'Target 1', value: priceTargets.target1, color: 'text-blue-400' },
              { label: 'Target 2', value: priceTargets.target2, color: 'text-green-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-0.5">{label}</p>
                <p className={`${color} font-mono font-semibold text-sm`}>${parseFloat(value).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technicals */}
      {technicals && (
        <div className="glass-card rounded-xl p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">Technical Indicators</p>
          <div className="grid grid-cols-2 gap-y-2 text-xs">
            {[
              { label: 'RSI (14)', value: technicals.rsi ? `${technicals.rsi} ${technicals.rsi < 30 ? '(Oversold)' : technicals.rsi > 70 ? '(Overbought)' : ''}` : null },
              { label: 'SMA 20', value: technicals.sma20 ? `$${technicals.sma20}` : null },
              { label: 'SMA 50', value: technicals.sma50 ? `$${technicals.sma50}` : null },
              { label: 'EMA 12', value: technicals.ema12 ? `$${technicals.ema12}` : null },
              { label: 'Volume', value: technicals.volumeStrength },
              { label: 'BB Upper', value: technicals.bollingerUpper ? `$${technicals.bollingerUpper}` : null },
            ].filter(t => t.value).map(({ label, value }) => (
              <div key={label} className="flex justify-between gap-2">
                <span className="text-gray-500">{label}</span>
                <span className="text-gray-300 font-mono">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risks & Opportunities */}
      <div className="grid grid-cols-1 gap-3">
        {opportunities?.length > 0 && (
          <div className="glass-card rounded-xl p-4 border-green-500/20">
            <p className="text-green-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
              <CheckCircle size={12} /> Opportunities
            </p>
            <ul className="space-y-1">
              {opportunities.map((o, i) => (
                <li key={i} className="text-gray-300 text-xs flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span> {o}
                </li>
              ))}
            </ul>
          </div>
        )}
        {risks?.length > 0 && (
          <div className="glass-card rounded-xl p-4 border-red-500/20">
            <p className="text-red-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
              <AlertTriangle size={12} /> Risk Factors
            </p>
            <ul className="space-y-1">
              {risks.map((r, i) => (
                <li key={i} className="text-gray-300 text-xs flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">⚠</span> {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Risk Level */}
      <div className="flex items-center gap-2 text-sm">
        <Shield size={14} className={riskColor} />
        <span className="text-gray-400">Risk Level:</span>
        <span className={`font-semibold ${riskColor}`}>{riskLevel}</span>
      </div>
    </div>
  )
}
