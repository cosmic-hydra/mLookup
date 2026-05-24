import axios from 'axios'
import { getApiKeys } from '../config/apiConfig'

// Curated financial news from public RSS/JSON (no key needed)
const RSS_SOURCES = [
  { url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC&region=US&lang=en-US', source: 'Yahoo Finance' },
]

// Fallback curated news when no API key
const SAMPLE_NEWS = [
  {
    id: 1,
    title: 'Fed Signals Potential Rate Cuts as Inflation Cools to 2.8%',
    summary: 'Federal Reserve officials hint at possible rate reductions in H2 2026 as inflation data shows continued moderation toward the 2% target.',
    source: 'Reuters',
    time: '2h ago',
    sentiment: 'bullish',
    sentimentScore: 72,
    category: 'Macro',
    url: '#',
    impact: 'high',
    tags: ['Fed', 'Interest Rates', 'Inflation'],
  },
  {
    id: 2,
    title: 'NVIDIA Reports Q1 2026 Revenue of $26B, Beats Estimates by 18%',
    summary: 'AI chip demand drives another record quarter for NVIDIA. Data center segment grew 427% YoY. Stock up 8% in after-hours trading.',
    source: 'CNBC',
    time: '3h ago',
    sentiment: 'bullish',
    sentimentScore: 91,
    category: 'Earnings',
    url: '#',
    impact: 'high',
    tags: ['NVDA', 'AI', 'Earnings', 'Technology'],
  },
  {
    id: 3,
    title: 'Bitcoin ETF Sees $2.4B Weekly Inflows, Institutional Interest Surges',
    summary: 'Spot Bitcoin ETFs continue to attract record institutional capital. BlackRock\'s IBIT now holds over $25B in AUM.',
    source: 'CoinDesk',
    time: '4h ago',
    sentiment: 'bullish',
    sentimentScore: 85,
    category: 'Crypto',
    url: '#',
    impact: 'high',
    tags: ['Bitcoin', 'ETF', 'Institutional'],
  },
  {
    id: 4,
    title: 'Tesla Faces Production Challenges at New Berlin Gigafactory',
    summary: 'Supply chain disruptions and labor disputes are slowing production ramp at Tesla\'s European facility. Q2 delivery targets may be missed.',
    source: 'Bloomberg',
    time: '5h ago',
    sentiment: 'bearish',
    sentimentScore: 28,
    category: 'Stocks',
    url: '#',
    impact: 'medium',
    tags: ['TSLA', 'Manufacturing', 'EV'],
  },
  {
    id: 5,
    title: 'Apple Vision Pro 2 Unveiled — Priced at $2,499, Ships Q3 2026',
    summary: 'Apple\'s second-generation spatial computing headset features eye-tracking improvements and M4 Ultra chip. Pre-orders open next month.',
    source: 'TechCrunch',
    time: '6h ago',
    sentiment: 'bullish',
    sentimentScore: 68,
    category: 'Technology',
    url: '#',
    impact: 'medium',
    tags: ['AAPL', 'VR/AR', 'Product Launch'],
  },
  {
    id: 6,
    title: 'US Treasury Yields Fall as Jobs Data Shows Labor Market Cooling',
    summary: 'April payrolls added 142K jobs, below the 185K estimate. 10-year Treasury yield drops to 4.38% as bond investors anticipate Fed pivot.',
    source: 'WSJ',
    time: '7h ago',
    sentiment: 'neutral',
    sentimentScore: 50,
    category: 'Bonds',
    url: '#',
    impact: 'high',
    tags: ['Treasuries', 'Jobs', 'Economy'],
  },
  {
    id: 7,
    title: 'China\'s Alibaba Posts Surprise Revenue Growth, Cloud Division Up 14%',
    summary: 'Alibaba reported better-than-expected quarterly results driven by recovery in domestic consumer spending and rapid cloud infrastructure expansion.',
    source: 'FT',
    time: '8h ago',
    sentiment: 'bullish',
    sentimentScore: 74,
    category: 'International',
    url: '#',
    impact: 'medium',
    tags: ['BABA', 'China', 'Cloud', 'E-Commerce'],
  },
  {
    id: 8,
    title: 'Oil Prices Drop 3% on OPEC+ Production Increase Speculation',
    summary: 'WTI crude falls to $78/barrel amid reports that OPEC+ members are considering raising output caps at the upcoming June meeting.',
    source: 'Reuters',
    time: '9h ago',
    sentiment: 'bearish',
    sentimentScore: 30,
    category: 'Commodities',
    url: '#',
    impact: 'medium',
    tags: ['Oil', 'OPEC', 'Commodities', 'Energy'],
  },
  {
    id: 9,
    title: 'Ethereum Staking Rewards Hit 4.2% APY — Validator Count Reaches 1M',
    summary: 'The Ethereum network surpasses one million active validators as staking participation rises. ETH supply continues to deflate post-merge.',
    source: 'Decrypt',
    time: '10h ago',
    sentiment: 'bullish',
    sentimentScore: 80,
    category: 'Crypto',
    url: '#',
    impact: 'medium',
    tags: ['ETH', 'Ethereum', 'Staking', 'DeFi'],
  },
  {
    id: 10,
    title: 'Warren Buffett Increases Berkshire Stake in Occidental Petroleum to 28%',
    summary: 'Berkshire Hathaway disclosed additional OXY purchases totaling $1.8B in Q1 2026, signaling continued bullishness on oil sector.',
    source: 'Bloomberg',
    time: '11h ago',
    sentiment: 'bullish',
    sentimentScore: 78,
    category: 'Stocks',
    url: '#',
    impact: 'low',
    tags: ['BRK', 'OXY', 'Buffett', 'Energy'],
  },
  {
    id: 11,
    title: 'US Imposes 15% Tariff on Chinese Semiconductors — Tech Stocks Slide',
    summary: 'Biden administration expands trade restrictions, targeting advanced Chinese chips. Qualcomm, Intel and AMD fell 2-4% on the news.',
    source: 'CNBC',
    time: '12h ago',
    sentiment: 'bearish',
    sentimentScore: 22,
    category: 'Macro',
    url: '#',
    impact: 'high',
    tags: ['Trade War', 'Semiconductors', 'China', 'Policy'],
  },
  {
    id: 12,
    title: 'Solana Surpasses $200 as DeFi TVL Hits New All-Time High of $15B',
    summary: 'SOL token breaks key resistance as Solana ecosystem DeFi activity accelerates. New DEX volumes surpassed Ethereum for the first time.',
    source: 'CoinTelegraph',
    time: '14h ago',
    sentiment: 'bullish',
    sentimentScore: 88,
    category: 'Crypto',
    url: '#',
    impact: 'medium',
    tags: ['SOL', 'Solana', 'DeFi', 'Altcoins'],
  },
]

export const getNews = async (category = 'all', query = '') => {
  const keys = getApiKeys()

  if (keys.newsApi) {
    try {
      const params = {
        apiKey: keys.newsApi,
        language: 'en',
        pageSize: 30,
        sortBy: 'publishedAt',
      }
      if (query) params.q = query
      else params.q = 'stock market OR crypto OR finance OR investing'

      const { data } = await axios.get('https://newsapi.org/v2/everything', { params })
      if (data.articles) {
        return data.articles.map((a, i) => ({
          id: i,
          title: a.title,
          summary: a.description || '',
          source: a.source?.name || 'Unknown',
          time: new Date(a.publishedAt).toLocaleTimeString(),
          sentiment: 'neutral',
          sentimentScore: 50 + (Math.random() - 0.5) * 40,
          category: 'Markets',
          url: a.url,
          image: a.urlToImage,
          impact: 'medium',
          tags: [],
        }))
      }
    } catch (_) {}
  }

  let news = [...SAMPLE_NEWS]
  if (category !== 'all') {
    news = news.filter((n) => n.category.toLowerCase() === category.toLowerCase())
  }
  if (query) {
    const q = query.toLowerCase()
    news = news.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
    )
  }
  return news
}

export const getMarketSentiment = () => {
  // Aggregated sentiment across all news
  const scores = SAMPLE_NEWS.map((n) => n.sentimentScore)
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  const bullish = scores.filter((s) => s >= 60).length
  const bearish = scores.filter((s) => s <= 40).length
  const neutral = scores.length - bullish - bearish
  return {
    overall: Math.round(avg),
    bullish,
    bearish,
    neutral,
    total: scores.length,
    label: avg > 65 ? 'Greed' : avg > 55 ? 'Slightly Bullish' : avg < 35 ? 'Fear' : avg < 45 ? 'Slightly Bearish' : 'Neutral',
  }
}
