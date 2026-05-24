import { analyzeAsset } from './analysisService'
import { forecastPrices } from './predictorService'
import { getCoinDetail, getCoinChart, searchCoins } from './cryptoService'
import { getStockHistory, getStockQuote, searchStocks } from './stockService'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const CRYPTO_HINTS = ['bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'crypto', 'coin', 'token']
const CRYPTO_SYMBOL_ALIASES = {
  btc: 'bitcoin',
  eth: 'ethereum',
  sol: 'solana',
  bnb: 'binancecoin',
  xrp: 'ripple',
  ada: 'cardano',
  doge: 'dogecoin',
}

const NOISE_WORDS = new Set([
  'predict', 'prediction', 'forecast', 'analyze', 'analysis', 'for', 'the', 'next', 'days', 'day',
  'should', 'buy', 'sell', 'hold', 'with', 'risk', 'and', 'show', 'me', 'please', 'trend', 'price',
  'of', 'to', 'in', 'a', 'an', 'this', 'that', 'week', 'month', 'today', 'now', 'what', 'is', 'on',
])

const extractHorizonFromQuery = (query) => {
  const lower = query.toLowerCase()
  if (lower.includes('week') || lower.includes('7d')) return 7
  if (lower.includes('month') || lower.includes('30d')) return 30
  const matched = lower.match(/(\d{1,2})\s*(day|days|d)/)
  if (!matched) return 14
  return clamp(Number(matched[1]), 3, 90)
}

const inferIntent = (query) => {
  const lower = query.toLowerCase()
  const isCrypto = CRYPTO_HINTS.some((hint) => lower.includes(hint))
  return {
    marketType: isCrypto ? 'crypto' : 'stock',
    objective: lower.includes('risk') ? 'risk analysis' : 'price forecast',
    horizonDays: extractHorizonFromQuery(query),
  }
}

const normalizeStockHistory = (rows) => {
  return rows.map((row) => ({
    date: row.date,
    close: Number(row.close),
    volume: Number(row.volume || 0),
  }))
}

const normalizeCryptoHistory = (chartResponse) => {
  return (chartResponse?.prices || []).map(([ts, close], idx) => ({
    date: new Date(ts).toISOString().split('T')[0],
    close: Number(close),
    volume: Number(chartResponse?.total_volumes?.[idx]?.[1] || 0),
  }))
}

const unique = (items) => [...new Set(items.filter(Boolean))]

const extractStockCandidates = (query) => {
  const tokens = query.match(/[A-Za-z]{1,12}/g) || []
  const symbolCandidates = tokens
    .filter((token) => token === token.toUpperCase() && token.length >= 1 && token.length <= 5)
    .map((token) => token.toUpperCase())

  const wordCandidates = tokens
    .map((token) => token.toLowerCase())
    .filter((token) => token.length >= 2 && !NOISE_WORDS.has(token))

  return unique([...symbolCandidates, ...wordCandidates, query.trim()]).slice(0, 6)
}

const extractCryptoCandidates = (query) => {
  const tokens = query.match(/[A-Za-z]{2,20}/g) || []
  const normalized = tokens
    .map((token) => token.toLowerCase())
    .map((token) => CRYPTO_SYMBOL_ALIASES[token] || token)
    .filter((token) => token.length >= 2 && !NOISE_WORDS.has(token))

  return unique([...normalized, query.trim().toLowerCase()]).slice(0, 8)
}

const pickStockFromSearch = async (query) => {
  const candidates = extractStockCandidates(query)

  for (const candidate of candidates) {
    const results = await searchStocks(candidate)
    if (!results?.length) continue

    const lower = candidate.toLowerCase()
    const exactSymbol = results.find((row) => row.symbol?.toLowerCase() === lower)
    const exactName = results.find((row) => row.name?.toLowerCase() === lower)
    const startsWith = results.find((row) => row.symbol?.toLowerCase().startsWith(lower) || row.name?.toLowerCase().startsWith(lower))

    return exactSymbol || exactName || startsWith || results[0]
  }

  return null
}

const pickCryptoFromSearch = async (query) => {
  const candidates = extractCryptoCandidates(query)

  for (const candidate of candidates) {
    const results = await searchCoins(candidate)
    const coins = results?.coins || []
    if (!coins.length) continue

    const lower = candidate.toLowerCase()
    const exact = coins.find((coin) => coin.id === lower || coin.symbol === lower || coin.name?.toLowerCase() === lower)
    const startsWith = coins.find((coin) => coin.symbol?.toLowerCase().startsWith(lower) || coin.name?.toLowerCase().startsWith(lower))

    return exact || startsWith || coins[0]
  }

  return null
}

const buildTextSummary = ({ assetLabel, intent, analysis, forecast }) => {
  const sentiment = analysis.signalScore > 20 ? 'bullish' : analysis.signalScore < -20 ? 'bearish' : 'mixed'
  const expected = forecast.summary.expectedReturn
  const ciLow = forecast.summary.lowerBound
  const ciHigh = forecast.summary.upperBound

  return [
    `Forecast for ${assetLabel} over ${intent.horizonDays} days:`,
    `Model bias: ${sentiment} (${analysis.recommendation} / confidence ${analysis.confidence}%).`,
    `Projected move: ${expected >= 0 ? '+' : ''}${expected.toFixed(2)}% with end-price estimate near $${forecast.summary.predictedPrice.toFixed(2)}.`,
    `Confidence range (${Math.round(forecast.confidence * 100)}%): $${ciLow.toFixed(2)} to $${ciHigh.toFixed(2)}.`,
    `Main risks: ${analysis.risks.slice(0, 2).join(' | ') || 'No major red flags from current technical snapshot.'}`,
  ].join(' ')
}

export const runChatAnalyst = async (query, options = {}) => {
  const { onStep } = options
  const startedAt = Date.now()
  const steps = []

  const pushStep = (name, details) => {
    steps.push({
      name,
      details,
      elapsedMs: Date.now() - startedAt,
    })
    onStep?.([...steps])
  }

  const intent = inferIntent(query)
  pushStep('Intent Parsing', `Detected ${intent.marketType} workflow with ${intent.horizonDays}d forecast horizon.`)

  if (intent.marketType === 'crypto') {
    const picked = await pickCryptoFromSearch(query)
    if (!picked) {
      return {
        text: 'I could not find a matching crypto asset. Try symbol/name like BTC, ETH, or Solana.',
        source: 'Analyst Subprocess Engine',
        steps,
      }
    }
    pushStep('Asset Resolution', `Matched ${picked.name} (${picked.symbol?.toUpperCase()}).`)

    const [detail, chart] = await Promise.all([getCoinDetail(picked.id), getCoinChart(picked.id, 90)])
    const history = normalizeCryptoHistory(chart)
    const currentPrice = Number(detail?.market_data?.current_price?.usd || history.at(-1)?.close)
    pushStep('Data Acquisition', `Loaded ${history.length} historical points and current price $${currentPrice?.toFixed(2)}.`)

    const sentimentScore = clamp(50 + Number(detail?.market_data?.price_change_percentage_24h || 0) * 2, 15, 90)
    const analysis = analyzeAsset(
      {
        name: detail.name,
        price: currentPrice,
        change24h: detail?.market_data?.price_change_percentage_24h,
        change7d: detail?.market_data?.price_change_percentage_7d,
      },
      history,
      sentimentScore
    )
    pushStep('Technical Engine', `Signal score ${analysis.signalScore} with ${analysis.recommendation} recommendation.`)

    const forecast = forecastPrices({
      history,
      horizonDays: intent.horizonDays,
      confidence: 0.9,
      currentPrice,
      assetClass: 'crypto',
    })

    if (!forecast.ready) {
      return {
        text: forecast.reason,
        source: 'Analyst Subprocess Engine',
        steps,
      }
    }

    pushStep('Prediction Engine', `Generated ${forecast.horizonDays}-step path with confidence score ${forecast.summary.confidenceScore}/100.`)
    pushStep('Report Synthesis', 'Prepared chat-ready explanation, metrics, and chart data.')

    return {
      text: buildTextSummary({ assetLabel: detail.name, intent, analysis, forecast }),
      source: 'Analyst Subprocess Engine',
      steps,
      result: {
        marketType: 'crypto',
        assetName: detail.name,
        assetSymbol: detail.symbol?.toUpperCase(),
        currentPrice,
        analysis,
        forecast,
      },
    }
  }

  const picked = await pickStockFromSearch(query)
  if (!picked) {
    return {
      text: 'I could not find a matching stock. Try ticker/company like AAPL, NVDA, or Microsoft.',
      source: 'Analyst Subprocess Engine',
      steps,
    }
  }

  pushStep('Asset Resolution', `Matched ${picked.name} (${picked.symbol}).`)

  const [quote, historyRaw] = await Promise.all([getStockQuote(picked.symbol), getStockHistory(picked.symbol, 'compact')])
  const history = normalizeStockHistory(historyRaw)
  const currentPrice = Number(quote?.price || history.at(-1)?.close)
  pushStep('Data Acquisition', `Loaded ${history.length} historical points and current price $${currentPrice?.toFixed(2)}.`)

  const sentimentScore = clamp(50 + Number(quote?.change24h || 0) * 2, 15, 90)
  const analysis = analyzeAsset(
    {
      name: quote.name || picked.name,
      symbol: quote.symbol || picked.symbol,
      price: currentPrice,
      change24h: quote?.change24h,
      change7d: quote?.change7d,
    },
    history,
    sentimentScore
  )
  pushStep('Technical Engine', `Signal score ${analysis.signalScore} with ${analysis.recommendation} recommendation.`)

  const forecast = forecastPrices({
    history,
    horizonDays: intent.horizonDays,
    confidence: 0.9,
    currentPrice,
    assetClass: 'stock',
  })

  if (!forecast.ready) {
    return {
      text: forecast.reason,
      source: 'Analyst Subprocess Engine',
      steps,
    }
  }

  pushStep('Prediction Engine', `Generated ${forecast.horizonDays}-step path with confidence score ${forecast.summary.confidenceScore}/100.`)
  pushStep('Report Synthesis', 'Prepared chat-ready explanation, metrics, and chart data.')

  return {
    text: buildTextSummary({ assetLabel: quote.name || picked.name, intent, analysis, forecast }),
    source: 'Analyst Subprocess Engine',
    steps,
    result: {
      marketType: 'stock',
      assetName: quote.name || picked.name,
      assetSymbol: quote.symbol || picked.symbol,
      currentPrice,
      analysis,
      forecast,
      isSimulated: Boolean(quote?.simulated),
    },
  }
}
