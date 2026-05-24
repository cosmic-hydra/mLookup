import NewsPanel from '../components/News/NewsPanel'
import { getMarketSentiment } from '../services/newsService'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function News() {
  const sentiment = getMarketSentiment()
  const sentColor = sentiment.overall >= 60 ? 'text-green-400' : sentiment.overall <= 40 ? 'text-red-400' : 'text-gray-400'

  return (
    <div className="p-4 md:p-6 max-w-screen-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Financial News & Sentiment</h1>
        <p className="text-gray-400 text-sm">Market news · Sentiment analysis · AI-tagged categories</p>
      </div>

      {/* Sentiment Bar */}
      <div className="glass-card rounded-xl p-5">
        <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">Overall Market Sentiment</p>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className={`text-4xl font-black font-mono ${sentColor}`}>{sentiment.overall}</p>
            <p className={`text-sm font-semibold ${sentColor}`}>{sentiment.label}</p>
          </div>
          <div className="flex-1">
            <div className="flex gap-1 rounded-full overflow-hidden h-3 mb-2">
              <div className="bg-green-400/70 rounded-l-full transition-all" style={{ width: `${(sentiment.bullish / sentiment.total) * 100}%` }} />
              <div className="bg-gray-500/50 transition-all" style={{ width: `${(sentiment.neutral / sentiment.total) * 100}%` }} />
              <div className="bg-red-400/70 rounded-r-full transition-all" style={{ width: `${(sentiment.bearish / sentiment.total) * 100}%` }} />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-green-400 flex items-center gap-1"><TrendingUp size={10} /> Bullish {sentiment.bullish}</span>
              <span className="text-gray-400 flex items-center gap-1"><Minus size={10} /> Neutral {sentiment.neutral}</span>
              <span className="text-red-400 flex items-center gap-1"><TrendingDown size={10} /> Bearish {sentiment.bearish}</span>
            </div>
          </div>
        </div>
      </div>

      <NewsPanel limit={50} />
    </div>
  )
}
