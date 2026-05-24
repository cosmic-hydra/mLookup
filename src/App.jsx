import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import Header from './components/Layout/Header'
import Footer from './components/Layout/Footer'
import RouteLoader from './components/Common/RouteLoader'

const Home = lazy(() => import('./pages/Home'))
const Crypto = lazy(() => import('./pages/Crypto'))
const Stocks = lazy(() => import('./pages/Stocks'))
const IPO = lazy(() => import('./pages/IPO'))
const Bonds = lazy(() => import('./pages/Bonds'))
const News = lazy(() => import('./pages/News'))
const AIChat = lazy(() => import('./pages/AIChat'))
const Settings = lazy(() => import('./pages/Settings'))
const ModelPerformance = lazy(() => import('./pages/ModelPerformance'))

function AppInner() {
  const navigate = useNavigate()

  const handleSearch = (query) => {
    // Determine type: crypto symbol, stock ticker, or keyword
    const q = query.toLowerCase().trim()
    // Route to stocks or crypto based on common prefixes
    const cryptoKeywords = ['btc', 'eth', 'bitcoin', 'ethereum', 'sol', 'bnb', 'xrp', 'ada', 'avax', 'dot', 'crypto']
    const isCrypto = cryptoKeywords.some((k) => q.includes(k))
    if (isCrypto) navigate(`/crypto`)
    else navigate(`/stocks/${query.toUpperCase()}`)
  }

  return (
    <div className="min-h-screen flex flex-col bg-dark-900">
      <Header onSearch={handleSearch} />
      <main className="flex-1">
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/crypto" element={<Crypto />} />
            <Route path="/crypto/:coinId" element={<Crypto />} />
            <Route path="/stocks" element={<Stocks />} />
            <Route path="/stocks/:symbol" element={<Stocks />} />
            <Route path="/ipo" element={<IPO />} />
            <Route path="/bonds" element={<Bonds />} />
            <Route path="/news" element={<News />} />
            <Route path="/ai" element={<AIChat />} />
            <Route path="/model-lab" element={<ModelPerformance />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}
