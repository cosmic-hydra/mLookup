import { useEffect, useState, useCallback } from 'react'
import { getNews } from '../../services/newsService'
import { formatDate } from 'date-fns'
import { ExternalLink, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react'
import LoadingSpinner from '../Common/LoadingSpinner'

const CATEGORIES = ['all', 'Crypto', 'Stocks', 'Macro', 'Earnings', 'Bonds', 'Commodities', 'Technology', 'International']

const SentimentBadge = ({ sentiment, score }) => {
  const config = {
    bullish: { color: 'text-green-400 bg-green-400/10 border-green-400/20', icon: <TrendingUp size={10} /> },
    bearish: { color: 'text-red-400 bg-red-400/10 border-red-400/20', icon: <TrendingDown size={10} /> },
    neutral: { color: 'text-gray-400 bg-gray-400/10 border-gray-400/20', icon: <Minus size={10} /> },
  }[sentiment] || { color: 'text-gray-400 bg-gray-400/10 border-gray-400/20', icon: <Minus size={10} /> }

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium ${config.color}`}>
      {config.icon}
      {sentiment?.toUpperCase()} {score ? `${Math.round(score)}%` : ''}
    </span>
  )
}

const ImpactDot = ({ impact }) => {
  const color = { high: 'bg-red-400', medium: 'bg-yellow-400', low: 'bg-gray-500' }[impact] || 'bg-gray-500'
  return <span title={`Impact: ${impact}`} className={`w-1.5 h-1.5 rounded-full shrink-0 ${color}`} />
}

export default function NewsPanel({ query = '', limit = 20 }) {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [filter, setFilter] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    getNews(category, query || filter)
      .then((d) => setNews(d.slice(0, limit)))
      .catch(() => setNews([]))
      .finally(() => setLoading(false))
  }, [category, query, filter, limit])

  useEffect(() => { load() }, [load])

  return (
    <div>
      {/* Category filter */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              category === cat
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-gray-400 hover:text-white border border-white/10 hover:border-white/20'
            }`}
          >
            {cat === 'all' ? 'All News' : cat}
          </button>
        ))}
        <button onClick={load} className="ml-auto p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 shrink-0">
          <RefreshCw size={14} />
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading news…" />
      ) : (
        <div className="space-y-3">
          {news.map((item) => (
            <article key={item.id} className="glass-card rounded-xl p-4 hover:border-white/15 transition-all group">
              <div className="flex items-start gap-3">
                <ImpactDot impact={item.impact} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-white text-sm font-semibold leading-snug group-hover:text-blue-200 transition-colors line-clamp-2">
                      {item.title}
                    </h4>
                    {item.url && item.url !== '#' && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-gray-600 hover:text-blue-400">
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  {item.summary && (
                    <p className="text-gray-400 text-xs line-clamp-2 mb-2">{item.summary}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-blue-400 text-xs font-medium">{item.source}</span>
                    <span className="text-gray-600 text-xs">•</span>
                    <span className="text-gray-500 text-xs">{item.time}</span>
                    {item.category && (
                      <>
                        <span className="text-gray-600 text-xs">•</span>
                        <span className="text-gray-500 text-xs bg-white/5 px-1.5 py-0.5 rounded">{item.category}</span>
                      </>
                    )}
                    <SentimentBadge sentiment={item.sentiment} score={item.sentimentScore} />
                    {item.tags?.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-gray-600 text-[10px] bg-white/5 px-1.5 py-0.5 rounded">#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
          {!news.length && (
            <div className="text-center py-12 text-gray-500">No news found for this filter.</div>
          )}
        </div>
      )}
    </div>
  )
}
