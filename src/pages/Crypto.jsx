import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCoinMarkets, getCoinDetail, getCoinChart, searchCoins } from '../services/cryptoService'
import { analyzeAsset } from '../services/analysisService'
import { formatPrice, formatMarketCap, formatVolume } from '../utils/format'
import PriceChange from '../components/Common/PriceChange'
import PriceChart from '../components/Charts/PriceChart'
import AnalysisCard from '../components/Analysis/AnalysisCard'
import PredictorCard from '../components/Analysis/PredictorCard'
import LoadingSpinner from '../components/Common/LoadingSpinner'
import { Search, ArrowLeft, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react'

export default function Crypto() {
  const { coinId } = useParams()
  const navigate = useNavigate()
  const [coins, setCoins] = useState([])
  const [detail, setDetail] = useState(null)
  const [chart, setChart] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [chartDays, setChartDays] = useState(7)
  const [sortBy, setSortBy] = useState('market_cap')
  const [page, setPage] = useState(1)

  useEffect(() => {
    getCoinMarkets(page, 50)
      .then(setCoins)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => {
    if (!coinId) return
    setDetailLoading(true)
    setDetail(null)
    Promise.all([getCoinDetail(coinId), getCoinChart(coinId, chartDays)])
      .then(([d, c]) => {
        setDetail(d)
        const chartData = c.prices.map(([ts, price]) => ({
          date: new Date(ts).toISOString().split('T')[0],
          close: price,
          time: new Date(ts).toLocaleTimeString(),
        }))
        setChart(chartData)
        // Analyze
        const hist = chartData.map((p) => ({ close: p.close }))
        const a = analyzeAsset(
          {
            name: d.name,
            price: d.market_data?.current_price?.usd,
            change24h: d.market_data?.price_change_percentage_24h,
            change7d: d.market_data?.price_change_percentage_7d,
          },
          hist,
          60 + Math.random() * 30
        )
        setAnalysis(a)
      })
      .catch(() => {})
      .finally(() => setDetailLoading(false))
  }, [coinId, chartDays])

  const handleSearch = useCallback(async (q) => {
    if (!q.trim()) { setSearchResults([]); return }
    setSearchLoading(true)
    try {
      const r = await searchCoins(q)
      setSearchResults(r.coins?.slice(0, 8) || [])
    } finally {
      setSearchLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => handleSearch(search), 350)
    return () => clearTimeout(t)
  }, [search, handleSearch])

  const sorted = [...coins].sort((a, b) => {
    if (sortBy === 'price') return b.current_price - a.current_price
    if (sortBy === '24h') return b.price_change_percentage_24h - a.price_change_percentage_24h
    if (sortBy === 'volume') return b.total_volume - a.total_volume
    return b.market_cap - a.market_cap
  })

  // Detail view
  if (coinId) {
    if (detailLoading) return <div className="p-6"><LoadingSpinner text="Loading coin data…" /></div>
    if (!detail) return <div className="p-6 text-gray-400">Coin not found.</div>
    const md = detail.market_data
    const price = md?.current_price?.usd
    return (
      <div className="p-4 md:p-6 max-w-screen-xl mx-auto space-y-6">
        <button onClick={() => navigate('/crypto')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Back to Crypto Markets
        </button>
        <div className="flex items-center gap-4">
          <img src={detail.image?.large} alt={detail.name} className="w-14 h-14 rounded-full" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">{detail.name}</h1>
              <span className="text-gray-400 text-sm uppercase bg-white/5 px-2 py-0.5 rounded">{detail.symbol}</span>
              {detail.market_cap_rank && <span className="text-gray-500 text-xs">#{detail.market_cap_rank}</span>}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-white font-mono font-bold text-2xl">${formatPrice(price)}</span>
              <PriceChange value={md?.price_change_percentage_24h} size="lg" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-xl p-5">
              <PriceChart
                data={chart}
                title={`${detail.name} Price`}
                onRangeChange={(d) => setChartDays(d)}
              />
            </div>
            {/* Market Stats */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-white font-semibold mb-4">Market Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Market Cap', value: formatMarketCap(md?.market_cap?.usd) },
                  { label: '24h Volume', value: formatMarketCap(md?.total_volume?.usd) },
                  { label: 'Circulating Supply', value: `${formatVolume(md?.circulating_supply)} ${detail.symbol?.toUpperCase()}` },
                  { label: 'Max Supply', value: md?.max_supply ? `${formatVolume(md.max_supply)} ${detail.symbol?.toUpperCase()}` : '∞' },
                  { label: '7d Change', value: null, el: <PriceChange value={md?.price_change_percentage_7d} /> },
                  { label: '30d Change', value: null, el: <PriceChange value={md?.price_change_percentage_30d} /> },
                  { label: 'ATH', value: `$${formatPrice(md?.ath?.usd)}` },
                  { label: 'ATH Date', value: md?.ath_date?.usd ? new Date(md.ath_date.usd).toLocaleDateString() : 'N/A' },
                  { label: 'All-Time Low', value: `$${formatPrice(md?.atl?.usd)}` },
                ].map(({ label, value, el }) => (
                  <div key={label}>
                    <p className="text-gray-500 text-xs mb-0.5">{label}</p>
                    {el || <p className="text-white font-mono text-sm font-medium">{value}</p>}
                  </div>
                ))}
              </div>
            </div>
            {/* Description */}
            {detail.description?.en && (
              <div className="glass-card rounded-xl p-5">
                <h3 className="text-white font-semibold mb-3">About {detail.name}</h3>
                <p className="text-gray-400 text-sm leading-relaxed line-clamp-6"
                  dangerouslySetInnerHTML={{ __html: detail.description.en.split('.').slice(0, 4).join('.') + '.' }}
                />
              </div>
            )}
          </div>
          {/* Analysis */}
          <div className="space-y-6">
            {analysis ? (
              <AnalysisCard analysis={analysis} assetName={detail.name} />
            ) : (
              <div className="glass-card rounded-xl p-4 text-center text-gray-500 text-sm py-8">
                Analysis requires more price history data.
              </div>
            )}
            <PredictorCard
              assetName={detail.name}
              history={chart}
              currentPrice={price}
              assetClass="crypto"
            />
          </div>
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className="p-4 md:p-6 max-w-screen-2xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Crypto Markets</h1>
          <p className="text-gray-400 text-sm">Live data from CoinGecko · {coins.length} assets</p>
        </div>
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search crypto…"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50"
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-dark-800 border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden">
              {searchResults.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { navigate(`/crypto/${c.id}`); setSearch(''); setSearchResults([]) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-left"
                >
                  {c.thumb && <img src={c.thumb} alt={c.symbol} className="w-6 h-6 rounded-full" />}
                  <span className="text-white text-sm">{c.name}</span>
                  <span className="text-gray-500 text-xs uppercase ml-auto">{c.symbol}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sort */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: 'market_cap', label: 'Market Cap' },
          { key: 'price', label: 'Price' },
          { key: '24h', label: '24h Change' },
          { key: 'volume', label: 'Volume' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              sortBy === key ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-gray-400 hover:text-white bg-white/5'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner text="Loading crypto markets…" />
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-gray-500 text-xs">
                  <th className="text-left px-4 py-3 font-medium">#</th>
                  <th className="text-left px-4 py-3 font-medium">Asset</th>
                  <th className="text-right px-4 py-3 font-medium">Price</th>
                  <th className="text-right px-4 py-3 font-medium">1h</th>
                  <th className="text-right px-4 py-3 font-medium">24h</th>
                  <th className="text-right px-4 py-3 font-medium">7d</th>
                  <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Market Cap</th>
                  <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">Volume (24h)</th>
                  <th className="text-right px-4 py-3 font-medium hidden xl:table-cell">7d Chart</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((coin) => (
                  <tr
                    key={coin.id}
                    onClick={() => navigate(`/crypto/${coin.id}`)}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-500">{coin.market_cap_rank}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={coin.image} alt={coin.symbol} className="w-7 h-7 rounded-full" />
                        <div>
                          <p className="text-white font-medium">{coin.name}</p>
                          <p className="text-gray-500 text-xs uppercase">{coin.symbol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-white font-mono font-semibold">
                      ${formatPrice(coin.current_price)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <PriceChange value={coin.price_change_percentage_1h_in_currency} showIcon={false} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <PriceChange value={coin.price_change_percentage_24h} showIcon={false} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <PriceChange value={coin.price_change_percentage_7d_in_currency} showIcon={false} />
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300 hidden md:table-cell">
                      {formatMarketCap(coin.market_cap)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300 hidden lg:table-cell">
                      {formatMarketCap(coin.total_volume)}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell w-24">
                      {coin.sparkline_in_7d?.price && (
                        <div className="w-20">
                          <PriceChange value={coin.price_change_percentage_7d_in_currency} showIcon={false} />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center gap-2">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:text-white disabled:opacity-30 text-sm">← Prev</button>
        <span className="px-4 py-2 text-gray-400 text-sm">Page {page}</span>
        <button onClick={() => setPage(p => p + 1)}
          className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:text-white text-sm">Next →</button>
      </div>
    </div>
  )
}
