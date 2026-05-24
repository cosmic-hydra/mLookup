import MarketTicker from '../components/Dashboard/MarketTicker'
import MarketOverview from '../components/Dashboard/MarketOverview'
import TrendingAssets from '../components/Dashboard/TrendingAssets'
import NewsPanel from '../components/News/NewsPanel'
import { Link } from 'react-router-dom'
import { MessageSquare, TrendingUp, Bitcoin, Calendar } from 'lucide-react'

const QuickLink = ({ to, icon: Icon, label, desc, color }) => (
  <Link to={to} className="glass-card rounded-xl p-4 flex items-center gap-4 hover:border-white/20 transition-all group">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color} shrink-0`}>
      <Icon size={20} className="text-white" />
    </div>
    <div>
      <p className="text-white font-semibold text-sm group-hover:text-blue-200 transition-colors">{label}</p>
      <p className="text-gray-500 text-xs">{desc}</p>
    </div>
  </Link>
)

export default function Home() {
  return (
    <div className="space-y-8">
      <MarketTicker />

      <div className="px-4 md:px-6 space-y-8">
        {/* Hero */}
        <div className="pt-4">
          <h1 className="text-2xl md:text-3xl font-black text-white">
            m<span className="text-blue-400">Lookup</span>
            <span className="text-gray-400 font-light text-lg ml-3">— AI Market Intelligence</span>
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Real-time prices · News sentiment · AI investment analysis · Stocks · Crypto · IPOs · Bonds · Futures
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickLink to="/ai" icon={MessageSquare} label="AI Advisor" desc="Ask any investment question" color="bg-blue-500/30" />
          <QuickLink to="/crypto" icon={Bitcoin} label="Crypto Markets" desc="Real-time crypto data" color="bg-orange-500/30" />
          <QuickLink to="/stocks" icon={TrendingUp} label="Stock Analysis" desc="Technical & fundamental" color="bg-green-500/30" />
          <QuickLink to="/ipo" icon={Calendar} label="IPO Calendar" desc="Upcoming listings" color="bg-purple-500/30" />
        </div>

        <MarketOverview />
        <TrendingAssets />

        {/* Latest News */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Latest Financial News</h2>
            <Link to="/news" className="text-blue-400 text-sm hover:text-blue-300 transition-colors">View all →</Link>
          </div>
          <NewsPanel limit={6} />
        </div>
      </div>
    </div>
  )
}
