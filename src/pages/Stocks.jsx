import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPopularStocks, searchStocks, getStockQuote, getStockHistory } from '../services/stockService'
import { analyzeAsset } from '../services/analysisService'
import { formatPrice, formatMarketCap, formatVolume } from '../utils/format'
import PriceChange from '../components/Common/PriceChange'
import PriceChart from '../components/Charts/PriceChart'
import AnalysisCard from '../components/Analysis/AnalysisCard'
import PredictorCard from '../components/Analysis/PredictorCard'
import LoadingSpinner from '../components/Common/LoadingSpinner'
import { Search, ArrowLeft, Info } from 'lucide-react'

export default function Stocks() {
  const { symbol } = useParams()
  const navigate = useNavigate()
  const [stocks, setStocks] = useState([])
  const [detail, setDetail] = useState(null)
  const [history, setHistory] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [sector, setSector] = useState('all')

  useEffect(() => {
    setStocks(getPopularStocks())
  }, [])

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    setDetail(null)
    Promise.all([getStockQuote(symbol), getStockHistory(symbol)])
      .then(([q, h]) => {
        setDetail(q)
        setHistory(h)
        const a = analyzeAsset(q, h, 50 + Math.random() * 30)
        setAnalysis(a)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [symbol])

  const handleSearch = useCallback(async (q) => {
    if (!q.trim()) { setSearchResults([]); return }
    setSearchLoading(true)
    try {
      const r = await searchStocks(q)
      setSearchResults(r.slice(0, 8))
    } finally {
      setSearchLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => handleSearch(search), 350)
    return () => clearTimeout(t)
  }, [search, handleSearch])

  const sectors = ['all', ...new Set(stocks.map(s => s.sector))]
  const filtered = sector === 'all' ? stocks : stocks.filter(s => s.sector === sector)

  // Detail view
  if (symbol) {
    if (loading) return <div className="p-6"><LoadingSpinner text="Loading stock data…" /></div>
    if (!detail) return <div className="p-6 text-gray-400">Stock not found.</div>
    return (
      <div className="p-4 md:p-6 max-w-screen-xl mx-auto space-y-6">
        <button onClick={() => navigate('/stocks')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Back to Stocks
        </button>

        {detail.simulated && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs">
            <Info size={14} className="shrink-0" />
            Showing simulated data. Add an Alpha Vantage API key in Settings for real prices.
          </div>
        )}

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-white font-black text-sm">
            {detail.symbol?.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">{detail.symbol}</h1>
              {detail.sector && <span className="text-gray-400 text-xs bg-white/5 px-2 py-0.5 rounded">{detail.sector}</span>}
            </div>
            <p className="text-gray-400 text-sm">{detail.name}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-white font-mono font-bold text-2xl">${formatPrice(detail.price)}</span>
              <PriceChange value={detail.change24h} size="lg" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-xl p-5">
              <PriceChart data={history} title={`${detail.symbol} Price History`} />
            </div>
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-white font-semibold mb-4">Key Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Open', value: `$${formatPrice(detail.open)}` },
                  { label: 'Day High', value: `$${formatPrice(detail.high)}` },
                  { label: 'Day Low', value: `$${formatPrice(detail.low)}` },
                  { label: 'Volume', value: formatVolume(detail.volume) },
                  { label: 'Market Cap', value: detail.mc || 'N/A' },
                  { label: 'P/E Ratio', value: detail.pe || 'N/A' },
                  { label: 'Prev Close', value: detail.prevClose ? `$${formatPrice(detail.prevClose)}` : 'N/A' },
                  { label: '7d Change', value: null, el: <PriceChange value={detail.change7d} /> },
                ].map(({ label, value, el }) => (
                  <div key={label}>
                    <p className="text-gray-500 text-xs mb-0.5">{label}</p>
                    {el || <p className="text-white font-mono text-sm font-medium">{value}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            {analysis && <AnalysisCard analysis={analysis} assetName={detail.name || detail.symbol} />}
            <PredictorCard
              assetName={detail.name || detail.symbol}
              history={history}
              currentPrice={detail.price}
              isSimulated={Boolean(detail.simulated)}
              assetClass="stock"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-screen-2xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Stock Markets</h1>
          <p className="text-gray-400 text-sm">US equities — technical analysis · AI recommendations</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticker or name…"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50"
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-dark-800 border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden">
              {searchResults.map((s) => (
                <button
                  key={s.symbol}
                  onClick={() => { navigate(`/stocks/${s.symbol}`); setSearch(''); setSearchResults([]) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-left"
                >
                  <span className="text-blue-400 font-mono text-sm font-semibold w-14">{s.symbol}</span>
                  <span className="text-white text-sm truncate">{s.name}</span>
                  {s.price && <span className="text-gray-400 text-xs ml-auto">${formatPrice(s.price)}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sector filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sectors.map((s) => (
          <button
            key={s}
            onClick={() => setSector(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              sector === s ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-gray-400 hover:text-white bg-white/5'
            }`}
          >
            {s === 'all' ? 'All Sectors' : s}
          </button>
        ))}
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-gray-500 text-xs">
                <th className="text-left px-4 py-3 font-medium">Symbol</th>
                <th className="text-left px-4 py-3 font-medium">Company</th>
                <th className="text-right px-4 py-3 font-medium">Price</th>
                <th className="text-right px-4 py-3 font-medium">24h Change</th>
                <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Market Cap</th>
                <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">P/E</th>
                <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">Volume</th>
                <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Sector</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((stock) => (
                <tr
                  key={stock.symbol}
                  onClick={() => navigate(`/stocks/${stock.symbol}`)}
                  className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-white text-xs font-bold">
                        {stock.symbol.slice(0, 2)}
                      </div>
                      <span className="text-blue-300 font-mono font-semibold">{stock.symbol}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white">{stock.name}</td>
                  <td className="px-4 py-3 text-right text-white font-mono font-semibold">
                    ${formatPrice(stock.price)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <PriceChange value={stock.change24h} showIcon={false} />
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300 hidden md:table-cell">{stock.mc}</td>
                  <td className="px-4 py-3 text-right text-gray-300 hidden lg:table-cell">{stock.pe}</td>
                  <td className="px-4 py-3 text-right text-gray-300 hidden lg:table-cell">{formatVolume(stock.volume)}</td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">
                    <span className="text-gray-400 text-xs bg-white/5 px-2 py-0.5 rounded">{stock.sector}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
