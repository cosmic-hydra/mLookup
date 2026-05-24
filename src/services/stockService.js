import axios from 'axios'
import { ENDPOINTS, getApiKeys } from '../config/apiConfig'

// Popular stocks with simulated real-time data (seeded from base price)
const STOCK_SEEDS = {
  AAPL: { name: 'Apple Inc.', base: 189.5, sector: 'Technology', pe: 28.5, mc: '2.95T' },
  MSFT: { name: 'Microsoft Corp.', base: 415.2, sector: 'Technology', pe: 35.2, mc: '3.08T' },
  GOOGL: { name: 'Alphabet Inc.', base: 178.3, sector: 'Technology', pe: 23.1, mc: '2.19T' },
  AMZN: { name: 'Amazon.com Inc.', base: 192.7, sector: 'Consumer Cyclical', pe: 44.8, mc: '1.99T' },
  NVDA: { name: 'NVIDIA Corp.', base: 875.4, sector: 'Technology', pe: 68.3, mc: '2.15T' },
  META: { name: 'Meta Platforms Inc.', base: 519.8, sector: 'Technology', pe: 27.6, mc: '1.32T' },
  TSLA: { name: 'Tesla Inc.', base: 248.5, sector: 'Automotive', pe: 62.4, mc: '792B' },
  BRK: { name: 'Berkshire Hathaway', base: 411200, sector: 'Financial Services', pe: 21.3, mc: '901B' },
  JPM: { name: 'JPMorgan Chase', base: 198.4, sector: 'Financial Services', pe: 11.8, mc: '571B' },
  V: { name: 'Visa Inc.', base: 274.5, sector: 'Financial Services', pe: 29.4, mc: '567B' },
  JNJ: { name: 'Johnson & Johnson', base: 161.2, sector: 'Healthcare', pe: 24.1, mc: '390B' },
  WMT: { name: 'Walmart Inc.', base: 67.8, sector: 'Consumer Defensive', pe: 30.2, mc: '547B' },
  XOM: { name: 'Exxon Mobil Corp.', base: 114.3, sector: 'Energy', pe: 13.6, mc: '456B' },
  UNH: { name: 'UnitedHealth Group', base: 498.7, sector: 'Healthcare', pe: 19.8, mc: '462B' },
  MA: { name: 'Mastercard Inc.', base: 463.2, sector: 'Financial Services', pe: 34.7, mc: '434B' },
  HD: { name: 'Home Depot Inc.', base: 343.8, sector: 'Consumer Cyclical', pe: 22.5, mc: '342B' },
  PG: { name: 'Procter & Gamble', base: 168.9, sector: 'Consumer Defensive', pe: 26.8, mc: '398B' },
  BAC: { name: 'Bank of America', base: 38.7, sector: 'Financial Services', pe: 12.4, mc: '303B' },
  NFLX: { name: 'Netflix Inc.', base: 685.4, sector: 'Technology', pe: 45.6, mc: '294B' },
  DIS: { name: 'Walt Disney Co.', base: 91.3, sector: 'Communication Services', pe: 18.9, mc: '166B' },
}

// Seed-based pseudo-random for consistent "live" simulation
const seededRandom = (seed, salt = 0) => {
  const x = Math.sin(seed + salt + Date.now() / 1000000) * 10000
  return x - Math.floor(x)
}

const simulatePrice = (symbol, base) => {
  const seed = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const dayVariance = (seededRandom(seed, 1) - 0.5) * 0.04
  const hourVariance = (seededRandom(seed, 2) - 0.5) * 0.01
  const price = base * (1 + dayVariance + hourVariance)
  const change24h = dayVariance * 100
  const change7d = (seededRandom(seed, 3) - 0.45) * 8
  return {
    price: parseFloat(price.toFixed(2)),
    change24h: parseFloat(change24h.toFixed(2)),
    change7d: parseFloat(change7d.toFixed(2)),
    volume: Math.floor(seededRandom(seed, 4) * 80000000 + 5000000),
    high: parseFloat((price * 1.02).toFixed(2)),
    low: parseFloat((price * 0.98).toFixed(2)),
    open: parseFloat((price * (1 - dayVariance * 0.3)).toFixed(2)),
  }
}

export const getPopularStocks = () => {
  return Object.entries(STOCK_SEEDS).map(([symbol, info]) => {
    const sim = simulatePrice(symbol, info.base)
    return { symbol, ...info, ...sim, simulated: true }
  })
}

export const searchStocks = async (query) => {
  const q = query.toUpperCase()
  const local = Object.entries(STOCK_SEEDS)
    .filter(([sym, info]) =>
      sym.includes(q) || info.name.toUpperCase().includes(q)
    )
    .map(([symbol, info]) => {
      const sim = simulatePrice(symbol, info.base)
      return { symbol, ...info, ...sim, simulated: true }
    })

  const keys = getApiKeys()
  if (keys.alphaVantage) {
    try {
      const { data } = await axios.get(ENDPOINTS.alphaVantage, {
        params: { function: 'SYMBOL_SEARCH', keywords: query, apikey: keys.alphaVantage },
      })
      if (data.bestMatches) {
        return data.bestMatches.map((m) => ({
          symbol: m['1. symbol'],
          name: m['2. name'],
          sector: m['3. type'],
          simulated: false,
          fromApi: true,
        }))
      }
    } catch (_) {}
  }
  return local
}

export const getStockQuote = async (symbol) => {
  const keys = getApiKeys()
  if (keys.alphaVantage) {
    try {
      const { data } = await axios.get(ENDPOINTS.alphaVantage, {
        params: { function: 'GLOBAL_QUOTE', symbol, apikey: keys.alphaVantage },
      })
      const q = data['Global Quote']
      if (q && q['05. price']) {
        return {
          symbol,
          price: parseFloat(q['05. price']),
          change24h: parseFloat(q['10. change percent']?.replace('%', '') || 0),
          volume: parseInt(q['06. volume'] || 0),
          high: parseFloat(q['03. high']),
          low: parseFloat(q['04. low']),
          open: parseFloat(q['02. open']),
          prevClose: parseFloat(q['08. previous close']),
          simulated: false,
        }
      }
    } catch (_) {}
  }
  const info = STOCK_SEEDS[symbol.toUpperCase()]
  if (info) {
    const sim = simulatePrice(symbol, info.base)
    return { symbol, ...info, ...sim, simulated: true }
  }
  // Generate for unknown symbol
  const base = 50 + Math.random() * 200
  return {
    symbol: symbol.toUpperCase(),
    name: symbol.toUpperCase(),
    price: parseFloat(base.toFixed(2)),
    change24h: parseFloat(((Math.random() - 0.5) * 6).toFixed(2)),
    simulated: true,
  }
}

export const getStockHistory = async (symbol, outputsize = 'compact') => {
  const keys = getApiKeys()
  if (keys.alphaVantage) {
    try {
      const { data } = await axios.get(ENDPOINTS.alphaVantage, {
        params: { function: 'TIME_SERIES_DAILY', symbol, outputsize, apikey: keys.alphaVantage },
      })
      const series = data['Time Series (Daily)']
      if (series) {
        return Object.entries(series)
          .slice(0, 90)
          .reverse()
          .map(([date, d]) => ({
            date,
            open: parseFloat(d['1. open']),
            high: parseFloat(d['2. high']),
            low: parseFloat(d['3. low']),
            close: parseFloat(d['4. close']),
            volume: parseInt(d['5. volume']),
          }))
      }
    } catch (_) {}
  }
  // Simulate 90 days
  const info = STOCK_SEEDS[symbol.toUpperCase()]
  const base = info ? info.base : 100
  const result = []
  let price = base * 0.85
  for (let i = 89; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const change = (Math.random() - 0.48) * price * 0.025
    price = Math.max(price + change, 1)
    result.push({
      date: d.toISOString().split('T')[0],
      close: parseFloat(price.toFixed(2)),
      open: parseFloat((price * (1 - Math.random() * 0.01)).toFixed(2)),
      high: parseFloat((price * (1 + Math.random() * 0.015)).toFixed(2)),
      low: parseFloat((price * (1 - Math.random() * 0.015)).toFixed(2)),
      volume: Math.floor(Math.random() * 50000000 + 1000000),
    })
  }
  return result
}

// Upcoming IPOs (curated list with analysis)
export const getUpcomingIPOs = () => [
  {
    company: 'Klarna Bank AB',
    ticker: 'KLAR',
    exchange: 'NYSE',
    sector: 'Fintech',
    expectedDate: '2026-Q3',
    valuation: '$15B',
    description: 'Swedish BNPL leader expanding globally. Strong user growth but regulatory headwinds in EU.',
    hype: 85,
    riskLevel: 'Medium',
  },
  {
    company: 'Chime Financial',
    ticker: 'CHME',
    exchange: 'NASDAQ',
    sector: 'Neobank',
    expectedDate: '2026-Q3',
    valuation: '$8B',
    description: 'US neobank with 22M+ customers. Revenue growing 40% YoY. Competing with legacy banks.',
    hype: 78,
    riskLevel: 'Medium-High',
  },
  {
    company: 'Discord Inc.',
    ticker: 'DISC',
    exchange: 'NASDAQ',
    sector: 'Social/Gaming',
    expectedDate: '2026-Q4',
    valuation: '$12B',
    description: '19M daily active users. Monetization still early. Strong brand but unproven revenue model.',
    hype: 72,
    riskLevel: 'High',
  },
  {
    company: 'Databricks',
    ticker: 'DBRK',
    exchange: 'NASDAQ',
    sector: 'AI/Data',
    expectedDate: '2026-Q4',
    valuation: '$43B',
    description: 'AI data lakehouse platform. ARR >$1.6B growing 50%+ YoY. Enterprise AI infrastructure.',
    hype: 91,
    riskLevel: 'Medium',
  },
  {
    company: 'Canva',
    ticker: 'CANV',
    exchange: 'ASX/NYSE',
    sector: 'SaaS/Design',
    expectedDate: '2027-Q1',
    valuation: '$25B',
    description: 'Design platform with 170M+ users. Profitable with strong SMB and Enterprise segments.',
    hype: 88,
    riskLevel: 'Low-Medium',
  },
]

// Bond market data
export const getBondData = () => ({
  treasuries: [
    { name: '3-Month T-Bill', yield: 5.28, change: -0.02, type: 'US Treasury' },
    { name: '6-Month T-Bill', yield: 5.19, change: -0.03, type: 'US Treasury' },
    { name: '1-Year T-Note', yield: 4.98, change: -0.04, type: 'US Treasury' },
    { name: '2-Year T-Note', yield: 4.72, change: -0.06, type: 'US Treasury' },
    { name: '5-Year T-Note', yield: 4.45, change: -0.05, type: 'US Treasury' },
    { name: '10-Year T-Note', yield: 4.38, change: -0.04, type: 'US Treasury' },
    { name: '30-Year T-Bond', yield: 4.56, change: -0.02, type: 'US Treasury' },
  ],
  corporate: [
    { name: 'Apple 2030 Bond', yield: 4.85, rating: 'AAA', change: +0.01 },
    { name: 'Microsoft 2032 Bond', yield: 4.92, rating: 'AAA', change: -0.02 },
    { name: 'Amazon 2031 Bond', yield: 5.12, rating: 'AA', change: +0.03 },
    { name: 'Tesla 2027 Bond', yield: 6.45, rating: 'BB+', change: -0.05 },
    { name: 'Ford 2029 Bond', yield: 6.82, rating: 'BB', change: +0.08 },
  ],
  indices: {
    fedFundsRate: 5.25,
    prime: 8.50,
    libor3m: 5.45,
    sofr: 5.31,
    vix: 14.82,
  },
})

// Futures data
export const getFuturesData = () => ({
  commodities: [
    { name: 'WTI Crude Oil', symbol: 'CL', price: 78.42, change: -0.85, unit: '/barrel', expiry: 'Jul 26' },
    { name: 'Brent Crude', symbol: 'BZ', price: 82.15, change: -0.92, unit: '/barrel', expiry: 'Jul 26' },
    { name: 'Natural Gas', symbol: 'NG', price: 2.84, change: +0.12, unit: '/MMBtu', expiry: 'Jun 26' },
    { name: 'Gold', symbol: 'GC', price: 2342.5, change: +12.3, unit: '/oz', expiry: 'Aug 26' },
    { name: 'Silver', symbol: 'SI', price: 29.84, change: +0.48, unit: '/oz', expiry: 'Jul 26' },
    { name: 'Copper', symbol: 'HG', price: 4.52, change: +0.03, unit: '/lb', expiry: 'Jul 26' },
    { name: 'Corn', symbol: 'ZC', price: 452.25, change: -3.5, unit: '/bushel', expiry: 'Sep 26' },
    { name: 'Wheat', symbol: 'ZW', price: 571.00, change: -8.25, unit: '/bushel', expiry: 'Sep 26' },
    { name: 'Soybean', symbol: 'ZS', price: 1162.5, change: +4.75, unit: '/bushel', expiry: 'Nov 26' },
    { name: 'Cotton', symbol: 'CT', price: 72.84, change: -0.42, unit: '/lb', expiry: 'Dec 26' },
  ],
  indices: [
    { name: 'S&P 500 E-mini', symbol: 'ES', price: 5312.25, change: +18.5, expiry: 'Jun 26' },
    { name: 'Nasdaq 100 E-mini', symbol: 'NQ', price: 18742.5, change: +95.25, expiry: 'Jun 26' },
    { name: 'Dow Jones E-mini', symbol: 'YM', price: 39485.0, change: +124.0, expiry: 'Jun 26' },
    { name: 'Russell 2000 E-mini', symbol: 'RTY', price: 2089.4, change: +6.8, expiry: 'Jun 26' },
    { name: 'VIX Futures', symbol: 'VX', price: 15.42, change: -0.38, expiry: 'Jun 26' },
  ],
  currencies: [
    { name: 'Euro FX', symbol: 'EUR/USD', price: 1.0842, change: +0.0012 },
    { name: 'British Pound', symbol: 'GBP/USD', price: 1.2698, change: +0.0008 },
    { name: 'Japanese Yen', symbol: 'USD/JPY', price: 154.82, change: -0.34 },
    { name: 'Swiss Franc', symbol: 'USD/CHF', price: 0.9124, change: -0.0015 },
    { name: 'Australian Dollar', symbol: 'AUD/USD', price: 0.6612, change: +0.0021 },
  ],
})
