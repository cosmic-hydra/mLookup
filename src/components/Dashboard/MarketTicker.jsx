import { useEffect, useState } from 'react'
import { getCoinMarkets } from '../../services/cryptoService'
import PriceChange from '../Common/PriceChange'

export default function MarketTicker() {
  const [items, setItems] = useState([])

  useEffect(() => {
    getCoinMarkets(1, 20)
      .then(setItems)
      .catch(() => {})
  }, [])

  if (!items.length) return null

  const ticker = [...items, ...items] // duplicate for seamless scroll

  return (
    <div className="border-b border-white/5 bg-dark-900/60 backdrop-blur-sm overflow-hidden">
      <div className="flex animate-ticker whitespace-nowrap" style={{ width: 'max-content' }}>
        {ticker.map((coin, i) => (
          <div key={`${coin.id}-${i}`} className="inline-flex items-center gap-2 px-4 py-2 border-r border-white/5 shrink-0">
            <img src={coin.image} alt={coin.symbol} className="w-4 h-4 rounded-full" onError={(e) => e.target.style.display='none'} />
            <span className="text-gray-300 text-xs font-medium uppercase">{coin.symbol}</span>
            <span className="text-white text-xs font-mono font-semibold">
              ${coin.current_price?.toLocaleString('en-US', { maximumFractionDigits: 4 })}
            </span>
            <PriceChange value={coin.price_change_percentage_24h} showIcon={false} />
          </div>
        ))}
      </div>
    </div>
  )
}
