import { useEffect, useState } from 'react'
import { getTrending, getCoinMarkets } from '../../services/cryptoService'
import { SparklineChart } from '../Charts/PriceChart'
import PriceChange from '../Common/PriceChange'
import { formatPrice, formatMarketCap } from '../../utils/format'
import { Link } from 'react-router-dom'
import { Flame, Star } from 'lucide-react'
import LoadingSpinner from '../Common/LoadingSpinner'

export default function TrendingAssets() {
  const [trending, setTrending] = useState([])
  const [topCoins, setTopCoins] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getTrending(), getCoinMarkets(1, 7)])
      .then(([t, top]) => {
        setTrending(t.coins?.slice(0, 5) || [])
        setTopCoins(top)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner text="Loading market data…" />

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Trending */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Flame size={18} className="text-orange-400" />
          <h3 className="font-semibold text-white">Trending Now</h3>
        </div>
        <div className="space-y-3">
          {trending.map((item, i) => {
            const coin = item.item
            return (
              <Link
                key={coin.id}
                to={`/crypto/${coin.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <span className="text-gray-600 text-xs w-4 shrink-0">#{i + 1}</span>
                <img src={coin.thumb} alt={coin.symbol} className="w-7 h-7 rounded-full" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium group-hover:text-blue-300 transition-colors truncate">{coin.name}</p>
                  <p className="text-gray-500 text-xs uppercase">{coin.symbol}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-gray-400 text-xs">Rank #{coin.market_cap_rank}</p>
                  {coin.data?.price_change_percentage_24h?.usd != null && (
                    <PriceChange value={coin.data.price_change_percentage_24h.usd} showIcon={false} />
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Top by Market Cap */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Star size={18} className="text-yellow-400" />
          <h3 className="font-semibold text-white">Top Assets</h3>
        </div>
        <div className="space-y-2">
          {topCoins.map((coin) => (
            <Link
              key={coin.id}
              to={`/crypto/${coin.id}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
            >
              <img src={coin.image} alt={coin.symbol} className="w-7 h-7 rounded-full" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium group-hover:text-blue-300 transition-colors">{coin.name}</p>
                <p className="text-gray-500 text-xs font-mono uppercase">{coin.symbol}</p>
              </div>
              <div className="w-16 shrink-0">
                {coin.sparkline_in_7d?.price && (
                  <SparklineChart data={coin.sparkline_in_7d.price} height={32} />
                )}
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="text-white text-sm font-mono font-semibold">
                  ${formatPrice(coin.current_price)}
                </p>
                <PriceChange value={coin.price_change_percentage_24h} showIcon={false} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
