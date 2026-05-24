import { Link, useLocation } from 'react-router-dom'
import { TrendingUp, Search, Menu, X, Bell, Settings, Zap } from 'lucide-react'
import { useState } from 'react'

const nav = [
  { to: '/', label: 'Dashboard' },
  { to: '/crypto', label: 'Crypto' },
  { to: '/stocks', label: 'Stocks' },
  { to: '/ipo', label: 'IPO' },
  { to: '/bonds', label: 'Bonds & Futures' },
  { to: '/news', label: 'News' },
  { to: '/ai', label: 'AI Advisor' },
  { to: '/model-lab', label: 'Model Lab' },
]

export default function Header({ onSearch }) {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchVal.trim()) {
      onSearch?.(searchVal.trim())
      setSearchOpen(false)
      setSearchVal('')
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-dark-900/90 backdrop-blur-xl">
      <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="text-white font-black text-sm">m</span>
          </div>
          <span className="font-bold text-white text-lg tracking-tight">
            m<span className="text-blue-400">Lookup</span>
          </span>
        </Link>

        {/* Live badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          LIVE
        </div>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1 ml-2">
          {nav.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                location.pathname === to
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Search */}
        {searchOpen ? (
          <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-xs">
            <input
              autoFocus
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search ticker, name…"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50"
            />
            <button type="button" onClick={() => setSearchOpen(false)} className="text-gray-400 hover:text-white">
              <X size={18} />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Search size={18} />
          </button>
        )}

        <Link
          to="/settings"
          className={`p-2 rounded-lg transition-colors ${
            location.pathname === '/settings'
              ? 'text-blue-400 bg-blue-500/10'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings size={18} />
        </Link>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="lg:hidden border-t border-white/5 bg-dark-900/95 backdrop-blur-xl px-4 py-3 flex flex-col gap-1">
          {nav.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                location.pathname === to
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
