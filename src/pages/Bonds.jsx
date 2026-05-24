import { getBondData, getFuturesData } from '../services/stockService'
import PriceChange from '../components/Common/PriceChange'
import { useState } from 'react'
import { TrendingUp, BarChart2, DollarSign, Globe } from 'lucide-react'

const tabs = ['Bonds', 'Futures', 'Forex', 'Rates']

const YieldCurve = ({ treasuries }) => {
  const max = Math.max(...treasuries.map(t => t.yield))
  const min = Math.min(...treasuries.map(t => t.yield))
  return (
    <div className="mt-4">
      <p className="text-gray-500 text-xs mb-2">Yield Curve Visualization</p>
      <div className="flex items-end gap-1 h-20">
        {treasuries.map((t, i) => {
          const pct = ((t.yield - min) / (max - min + 0.001)) * 100
          const inverted = i > 0 && t.yield < treasuries[i - 1].yield
          return (
            <div key={t.name} className="flex-1 flex flex-col items-center gap-1" title={`${t.name}: ${t.yield}%`}>
              <div
                className={`w-full rounded-t transition-all ${inverted ? 'bg-red-400/60' : 'bg-blue-400/60'}`}
                style={{ height: `${Math.max(8, pct)}%` }}
              />
              <span className="text-gray-600 text-[8px] leading-none truncate">{t.name.split(' ')[0]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Bonds() {
  const [tab, setTab] = useState('Bonds')
  const { treasuries, corporate, indices } = getBondData()
  const { commodities, indices: futIndices, currencies } = getFuturesData()

  return (
    <div className="p-4 md:p-6 max-w-screen-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Bonds, Futures & Forex</h1>
        <p className="text-gray-400 text-sm">Fixed income · Commodity futures · Currency pairs · Key rates</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-0">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-blue-400 text-blue-300' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Bonds' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Treasuries */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-green-400" />
              US Treasury Yields
            </h3>
            <div className="space-y-2">
              {treasuries.map((t) => (
                <div key={t.name} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-gray-300 text-sm">{t.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-mono font-semibold">{t.yield}%</span>
                    <PriceChange value={t.change} showIcon={false} suffix="%" />
                  </div>
                </div>
              ))}
            </div>
            <YieldCurve treasuries={treasuries} />
          </div>

          {/* Corporate */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <BarChart2 size={16} className="text-blue-400" />
              Corporate Bonds
            </h3>
            <div className="space-y-2">
              {corporate.map((b) => (
                <div key={b.name} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-gray-300 text-sm">{b.name}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                      b.rating.startsWith('AA') ? 'text-green-400 bg-green-400/10' :
                      b.rating.startsWith('A') ? 'text-blue-400 bg-blue-400/10' :
                      'text-yellow-400 bg-yellow-400/10'
                    }`}>{b.rating}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-mono font-semibold">{b.yield}%</span>
                    <PriceChange value={b.change} showIcon={false} suffix="%" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Futures' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Commodity Futures</h3>
            <div className="space-y-2">
              {commodities.map((f) => (
                <div key={f.symbol} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-gray-300 text-sm">{f.name}</p>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span className="font-mono">{f.symbol}</span>
                      <span>·</span>
                      <span>{f.expiry}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-mono font-semibold">${f.price.toLocaleString()}</p>
                    <div className="flex items-center justify-end gap-1">
                      <PriceChange value={f.change} showIcon={false} suffix="" />
                      <span className="text-gray-500 text-xs">{f.unit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Index Futures</h3>
            <div className="space-y-2">
              {futIndices.map((f) => (
                <div key={f.symbol} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-gray-300 text-sm">{f.name}</p>
                    <span className="text-gray-500 text-xs font-mono">{f.symbol} · {f.expiry}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-mono font-semibold">{f.price.toLocaleString()}</p>
                    <PriceChange value={f.change} showIcon={false} suffix="" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Forex' && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Globe size={16} className="text-cyan-400" />
            Currency Pairs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currencies.map((c) => (
              <div key={c.symbol} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/8 transition-colors">
                <div>
                  <p className="text-white font-semibold">{c.symbol}</p>
                  <p className="text-gray-400 text-xs">{c.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-mono font-bold">{c.price.toFixed(4)}</p>
                  <PriceChange value={c.change} showIcon={false} suffix="" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Rates' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Fed Funds Rate', value: `${indices.fedFundsRate}%`, note: 'Upper bound', color: 'text-blue-400' },
            { label: 'US Prime Rate', value: `${indices.prime}%`, note: 'Bank lending', color: 'text-purple-400' },
            { label: 'LIBOR 3-Month', value: `${indices.libor3m}%`, note: 'Phasing out', color: 'text-orange-400' },
            { label: 'SOFR', value: `${indices.sofr}%`, note: 'LIBOR replacement', color: 'text-cyan-400' },
            { label: 'VIX', value: indices.vix.toFixed(2), note: 'Fear index', color: indices.vix > 20 ? 'text-red-400' : 'text-green-400' },
          ].map(({ label, value, note, color }) => (
            <div key={label} className="glass-card rounded-xl p-5">
              <p className="text-gray-400 text-xs mb-1">{label}</p>
              <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
              <p className="text-gray-500 text-xs mt-1">{note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
