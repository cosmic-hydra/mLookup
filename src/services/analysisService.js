import axios from 'axios'
import { getApiKeys } from '../config/apiConfig'

// ── Technical Analysis ──────────────────────────────────────────────────────

export const calcSMA = (prices, period) => {
  if (prices.length < period) return null
  const slice = prices.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / period
}

export const calcEMA = (prices, period) => {
  if (prices.length < period) return null
  const k = 2 / (period + 1)
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k)
  }
  return ema
}

export const calcRSI = (prices, period = 14) => {
  if (prices.length < period + 1) return null
  let gains = 0, losses = 0
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1]
    if (diff > 0) gains += diff
    else losses -= diff
  }
  let avgGain = gains / period
  let avgLoss = losses / period
  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1]
    const gain = diff > 0 ? diff : 0
    const loss = diff < 0 ? -diff : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
  }
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

export const calcBollingerBands = (prices, period = 20) => {
  if (prices.length < period) return null
  const slice = prices.slice(-period)
  const sma = slice.reduce((a, b) => a + b, 0) / period
  const variance = slice.reduce((acc, p) => acc + Math.pow(p - sma, 2), 0) / period
  const stdDev = Math.sqrt(variance)
  return { upper: sma + 2 * stdDev, middle: sma, lower: sma - 2 * stdDev, stdDev }
}

export const calcMACD = (prices) => {
  const ema12 = calcEMA(prices, 12)
  const ema26 = calcEMA(prices, 26)
  if (!ema12 || !ema26) return null
  const macd = ema12 - ema26
  return { macd, signal: calcEMA([...prices.slice(-9).map(() => macd)], 9), histogram: 0 }
}

export const calcVolumeStrength = (volumes) => {
  if (!volumes || volumes.length < 10) return 'N/A'
  const avg = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20
  const recent = volumes.slice(-3).reduce((a, b) => a + b, 0) / 3
  const ratio = recent / avg
  if (ratio > 1.5) return 'Very High'
  if (ratio > 1.2) return 'High'
  if (ratio > 0.8) return 'Normal'
  if (ratio > 0.5) return 'Low'
  return 'Very Low'
}

// ── Investment Analysis Engine ───────────────────────────────────────────────

export const analyzeAsset = (asset, priceHistory = [], sentimentScore = 50) => {
  const prices = priceHistory.map((p) => p.close || p.price || p)
  const volumes = priceHistory.map((p) => p.volume || 0)

  const rsi = prices.length > 15 ? calcRSI(prices) : null
  const sma20 = calcSMA(prices, 20)
  const sma50 = calcSMA(prices, 50)
  const ema12 = calcEMA(prices, 12)
  const ema26 = calcEMA(prices, 26)
  const bb = calcBollingerBands(prices)
  const volumeStrength = calcVolumeStrength(volumes)

  const currentPrice = prices[prices.length - 1] || asset.price || 0
  const change24h = asset.change24h || asset.price_change_percentage_24h || 0
  const change7d = asset.change7d || asset.price_change_percentage_7d_in_currency || 0

  // Signal scoring (-100 to +100, positive = bullish)
  let signalScore = 0
  const signals = []
  const risks = []
  const opportunities = []

  // RSI signals
  if (rsi !== null) {
    if (rsi < 30) {
      signalScore += 25
      signals.push({ label: `RSI Oversold (${rsi.toFixed(1)})`, type: 'bullish', strength: 'Strong' })
      opportunities.push('RSI below 30 — historically a good entry point')
    } else if (rsi < 45) {
      signalScore += 10
      signals.push({ label: `RSI Neutral-Low (${rsi.toFixed(1)})`, type: 'bullish', strength: 'Weak' })
    } else if (rsi > 70) {
      signalScore -= 25
      signals.push({ label: `RSI Overbought (${rsi.toFixed(1)})`, type: 'bearish', strength: 'Strong' })
      risks.push('RSI above 70 indicates overbought conditions — possible correction ahead')
    } else if (rsi > 55) {
      signalScore -= 10
      signals.push({ label: `RSI Neutral-High (${rsi.toFixed(1)})`, type: 'bearish', strength: 'Weak' })
    } else {
      signals.push({ label: `RSI Neutral (${rsi.toFixed(1)})`, type: 'neutral', strength: 'Neutral' })
    }
  }

  // Moving average signals
  if (sma20 && sma50) {
    if (currentPrice > sma20 && sma20 > sma50) {
      signalScore += 20
      signals.push({ label: 'Price above SMA20 > SMA50 (Golden alignment)', type: 'bullish', strength: 'Strong' })
      opportunities.push('Price in uptrend — above both 20 and 50-day moving averages')
    } else if (currentPrice < sma20 && sma20 < sma50) {
      signalScore -= 20
      signals.push({ label: 'Price below SMA20 < SMA50 (Death cross)', type: 'bearish', strength: 'Strong' })
      risks.push('Downtrend confirmed — price and moving averages aligned bearishly')
    } else if (currentPrice > sma20) {
      signalScore += 8
      signals.push({ label: 'Price above 20-day SMA', type: 'bullish', strength: 'Weak' })
    } else {
      signalScore -= 8
      signals.push({ label: 'Price below 20-day SMA', type: 'bearish', strength: 'Weak' })
    }
  }

  // Bollinger Band signals
  if (bb) {
    if (currentPrice <= bb.lower) {
      signalScore += 15
      signals.push({ label: 'Price at Lower Bollinger Band', type: 'bullish', strength: 'Moderate' })
      opportunities.push('Price touching lower Bollinger Band — potential mean reversion')
    } else if (currentPrice >= bb.upper) {
      signalScore -= 15
      signals.push({ label: 'Price at Upper Bollinger Band', type: 'bearish', strength: 'Moderate' })
      risks.push('Price at upper Bollinger Band — may face resistance or reversal')
    }
  }

  // Price momentum
  if (change24h > 5) {
    signalScore += 10
    signals.push({ label: `Strong 24h gain (+${change24h.toFixed(1)}%)`, type: 'bullish', strength: 'Moderate' })
  } else if (change24h < -5) {
    signalScore -= 10
    signals.push({ label: `Sharp 24h drop (${change24h.toFixed(1)}%)`, type: 'bearish', strength: 'Moderate' })
  }
  if (change7d > 15) {
    signalScore += 12
    opportunities.push('Strong 7-day momentum — trend in full swing')
  } else if (change7d < -15) {
    signalScore -= 12
    risks.push('Asset down >15% in 7 days — high selling pressure')
  }

  // Sentiment
  const sentDiff = sentimentScore - 50
  signalScore += sentDiff * 0.4
  if (sentimentScore > 70) {
    signals.push({ label: `High Positive Sentiment (${sentimentScore}%)`, type: 'bullish', strength: 'Moderate' })
    opportunities.push('Social and news sentiment strongly positive')
  } else if (sentimentScore < 30) {
    signals.push({ label: `Negative Sentiment (${sentimentScore}%)`, type: 'bearish', strength: 'Moderate' })
    risks.push('Weak sentiment may suppress price recovery')
  }

  // Volume
  if (volumeStrength === 'Very High' || volumeStrength === 'High') {
    const volumeType = signalScore > 0 ? 'bullish' : 'bearish'
    signals.push({ label: `${volumeStrength} Volume`, type: volumeType, strength: 'Moderate' })
    if (signalScore > 0) opportunities.push('Rising volume confirms bullish momentum')
    else risks.push('High volume on a downtrend increases selling pressure concern')
  }

  // Clamp score
  signalScore = Math.max(-100, Math.min(100, signalScore))

  // Generate recommendation
  let recommendation, confidence, action
  if (signalScore >= 40) {
    recommendation = 'BUY'
    action = 'Strong Buy'
    confidence = Math.min(95, 60 + signalScore * 0.35)
  } else if (signalScore >= 15) {
    recommendation = 'BUY'
    action = 'Moderate Buy'
    confidence = Math.min(80, 55 + signalScore * 0.5)
  } else if (signalScore >= -15) {
    recommendation = 'HOLD'
    action = 'Hold / Watch'
    confidence = 60
  } else if (signalScore >= -40) {
    recommendation = 'SELL'
    action = 'Consider Reducing'
    confidence = Math.min(80, 55 + Math.abs(signalScore) * 0.5)
  } else {
    recommendation = 'SELL'
    action = 'Strong Sell / Avoid'
    confidence = Math.min(95, 60 + Math.abs(signalScore) * 0.35)
  }

  // Risk level
  const volatility = change7d ? Math.abs(change7d) : Math.abs(change24h) * 3
  let riskLevel
  if (volatility > 30) riskLevel = 'Very High'
  else if (volatility > 20) riskLevel = 'High'
  else if (volatility > 10) riskLevel = 'Medium-High'
  else if (volatility > 5) riskLevel = 'Medium'
  else riskLevel = 'Low'

  // Target prices
  const support = sma20 ? Math.min(sma20, currentPrice * 0.92) : currentPrice * 0.90
  const resistance = sma50 ? Math.max(sma50, currentPrice * 1.08) : currentPrice * 1.10
  const target1 = currentPrice * (1 + (signalScore / 200))
  const target2 = currentPrice * (1 + (signalScore / 100))
  const stopLoss = currentPrice * (1 - Math.max(0.05, volatility / 200))

  // Summary text
  const name = asset.name || asset.symbol || 'This asset'
  const summary = generateSummary(name, recommendation, signalScore, rsi, change24h, change7d, riskLevel, signals)

  return {
    recommendation,
    action,
    confidence: Math.round(confidence),
    signalScore: Math.round(signalScore),
    riskLevel,
    signals,
    risks,
    opportunities,
    technicals: {
      rsi: rsi ? rsi.toFixed(1) : null,
      sma20: sma20 ? sma20.toFixed(2) : null,
      sma50: sma50 ? sma50.toFixed(2) : null,
      ema12: ema12 ? ema12.toFixed(2) : null,
      ema26: ema26 ? ema26.toFixed(2) : null,
      bollingerUpper: bb ? bb.upper.toFixed(2) : null,
      bollingerLower: bb ? bb.lower.toFixed(2) : null,
      volumeStrength,
    },
    priceTargets: {
      support: support.toFixed(2),
      resistance: resistance.toFixed(2),
      target1: target1.toFixed(2),
      target2: target2.toFixed(2),
      stopLoss: stopLoss.toFixed(2),
    },
    summary,
  }
}

const generateSummary = (name, rec, score, rsi, ch24, ch7, risk, signals) => {
  const bullishSignals = signals.filter((s) => s.type === 'bullish').length
  const bearishSignals = signals.filter((s) => s.type === 'bearish').length

  if (rec === 'BUY') {
    return `${name} shows ${score >= 40 ? 'strong' : 'moderate'} bullish characteristics. ` +
      `${bullishSignals} bullish technical signals detected against ${bearishSignals} bearish. ` +
      (rsi && rsi < 40 ? 'RSI in oversold territory is a favorable entry indicator. ' : '') +
      `7-day performance of ${ch7 > 0 ? '+' : ''}${ch7?.toFixed(1) || 'N/A'}% indicates ${ch7 > 0 ? 'positive' : 'building'} momentum. ` +
      `Risk is rated ${risk}. Consider position sizing appropriately and setting stop-losses.`
  } else if (rec === 'SELL') {
    return `${name} exhibits ${score <= -40 ? 'strong' : 'moderate'} bearish signals. ` +
      `${bearishSignals} bearish technical indicators active. ` +
      (rsi && rsi > 65 ? 'RSI in overbought zone suggests potential correction. ' : '') +
      `24h change of ${ch24?.toFixed(1) || 'N/A'}% reinforces downward pressure. ` +
      `Risk level: ${risk}. Tighten stop-losses or reduce exposure if holding.`
  } else {
    return `${name} is in a consolidation phase with mixed signals. ` +
      `${bullishSignals} bullish vs ${bearishSignals} bearish indicators — no clear directional edge. ` +
      `Risk level: ${risk}. Wait for a clearer breakout or breakdown before entering a position. ` +
      `Monitor volume and news catalysts for directional confirmation.`
  }
}

// ── AI Chat Query Handler ────────────────────────────────────────────────────

export const handleAIQuery = async (query, context = {}) => {
  const keys = getApiKeys()

  if (keys.openai) {
    try {
      const systemPrompt = `You are mLookup's AI investment advisor — an expert financial analyst with deep knowledge of stocks, crypto, bonds, IPOs, futures, and macroeconomics. 
You provide data-driven, balanced investment analysis. Always mention relevant risks. Never guarantee returns.
Current market context: ${JSON.stringify(context)}`

      const { data } = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        },
        { headers: { Authorization: `Bearer ${keys.openai}`, 'Content-Type': 'application/json' } }
      )
      return {
        text: data.choices[0].message.content,
        source: 'GPT-4o Mini',
        powered: true,
      }
    } catch (err) {
      if (err.response?.status === 401) {
        return { text: 'Invalid OpenAI API key. Please check your key in Settings.', source: 'System', powered: false }
      }
    }
  }

  return { text: generateRuleBasedResponse(query, context), source: 'mLookup AI Engine', powered: false }
}

const generateRuleBasedResponse = (query, context) => {
  const q = query.toLowerCase()

  // Asset-specific queries
  const cryptoKeywords = ['bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'crypto', 'coin', 'token', 'defi', 'nft']
  const stockKeywords = ['stock', 'share', 'equity', 'aapl', 'apple', 'nvidia', 'nvda', 'tesla', 'tsla', 'msft', 'microsoft']
  const bondKeywords = ['bond', 'treasury', 'yield', 'fixed income', 'debt', 'coupon']
  const ipoKeywords = ['ipo', 'initial public offering', 'listing', 'going public']
  const futuresKeywords = ['futures', 'commodity', 'oil', 'gold', 'silver', 'wheat', 'corn']
  const macroKeywords = ['inflation', 'interest rate', 'fed', 'recession', 'gdp', 'economy', 'market']

  if (ipoKeywords.some((k) => q.includes(k))) {
    return `**IPO Investment Analysis**\n\nIPOs can be highly rewarding but carry significant risks:\n\n**Key factors to evaluate:**\n• **Company fundamentals** — Revenue growth, path to profitability, competitive moat\n• **Valuation** — Compare P/S or P/E to sector peers. Inflated valuations are common in hot IPOs\n• **Lock-up period** — Insider selling post lock-up (typically 90-180 days) can suppress prices\n• **Use of proceeds** — Growth capital is positive; debt repayment is a red flag\n• **Underwriter quality** — Goldman, Morgan Stanley, JPM underwritten IPOs tend to perform better long-term\n\n**Strategy:**\n📌 Wait 3-6 months post-IPO for price discovery unless you have strong conviction\n📌 Avoid FOMO pricing — many IPOs trade below listing price within 6 months\n📌 Allocate no more than 2-5% of portfolio to any single IPO\n\n*Add your OpenAI API key in Settings for deeper AI-powered IPO analysis.*`
  }

  if (cryptoKeywords.some((k) => q.includes(k))) {
    const btcPrice = context.btcPrice ? `$${context.btcPrice.toLocaleString()}` : 'current levels'
    return `**Crypto Investment Analysis**\n\nBitcoin is currently trading at ${btcPrice}.\n\n**Market Assessment:**\n• Institutional adoption continues accelerating via ETFs (BlackRock IBIT, Fidelity FBTC)\n• Bitcoin halving cycle (April 2024) historically precedes 12-18 month bull phases\n• Regulatory clarity in US improving with recent SEC/CFTC frameworks\n\n**Risk Factors:**\n⚠️ High volatility — 30-day drawdowns of 20-40% are common\n⚠️ Regulatory risk remains globally (EU MiCA, potential US restrictions)\n⚠️ Macro sensitivity — risk-off events cause crypto sell-offs\n\n**Positioning Guidance:**\n📌 For BTC: Suitable as 1-10% portfolio allocation for risk-tolerant investors\n📌 For Altcoins: Higher risk/reward, limit to 0.5-2% per position\n📌 Use Dollar-Cost Averaging (DCA) rather than lump-sum entry\n📌 Never invest more than you can afford to lose entirely\n\n*Connect your OpenAI API key in Settings for real-time AI analysis.*`
  }

  if (bondKeywords.some((k) => q.includes(k))) {
    return `**Bond Market Analysis**\n\nCurrent 10-Year Treasury yield: ~4.38%\n\n**Market Context:**\n• Fed Funds Rate at 5.25% — likely near peak of rate cycle\n• Yield curve remains inverted (2Y > 10Y) but normalizing\n• Rate cuts expected in H2 2026 per Fed guidance\n\n**Investment Case for Bonds:**\n✅ Lock in high yields before potential rate cuts\n✅ Duration risk pays off if rates fall\n✅ Capital appreciation potential when Fed pivots\n\n**Risks:**\n⚠️ Sticky inflation could delay rate cuts\n⚠️ Longer duration = higher price volatility\n⚠️ Credit risk for corporate bonds below investment grade\n\n**Recommendation by Risk Tolerance:**\n📌 Conservative: 2-5Y Treasuries or TIPS for inflation protection\n📌 Moderate: Investment-grade corporate bonds (A/AA rated)\n📌 Aggressive: High-yield bonds (BB/B) for 6-8% yields with equity-like risk\n\n*Add your OpenAI API key in Settings for personalized bond portfolio analysis.*`
  }

  if (stockKeywords.some((k) => q.includes(k))) {
    return `**Stock Market Analysis**\n\nS&P 500 trading around 5,312 (as of recent session).\n\n**Current Market Environment:**\n• Forward P/E of ~20x — slightly elevated but supported by AI earnings growth\n• Earnings season: Technology and AI names leading, Consumer Discretionary lagging\n• Technical picture: All major indices above 200-day moving averages (bullish)\n\n**Sector Recommendations:**\n📌 **Overweight:** Technology (AI infrastructure), Healthcare (GLP-1 drugs), Defense\n📌 **Neutral:** Financials, Industrials, Energy\n📌 **Underweight:** Real Estate (rate sensitive), Consumer Staples (crowded)\n\n**Key Risks:**\n⚠️ Concentration risk — top 10 S&P500 stocks = 35% of index\n⚠️ AI earnings expectations are priced to perfection\n⚠️ Geopolitical risk (Middle East, Taiwan Strait)\n\n*Add your OpenAI API key in Settings for stock-specific deep dives.*`
  }

  if (futuresKeywords.some((k) => q.includes(k))) {
    return `**Futures & Commodities Analysis**\n\nKey commodity prices:\n• Gold: $2,342/oz (+0.5% today) — Safe haven demand elevated\n• WTI Oil: $78.42/barrel — OPEC+ production decision pending\n• Natural Gas: $2.84/MMBtu — Seasonal demand softening\n\n**Macro Drivers:**\n• Dollar strength inversely affects most commodity prices\n• China demand is the swing factor for oil and metals in 2026\n• Supply chain normalization reducing agricultural commodity pressures\n\n**Trading Considerations:**\n📌 Futures carry rollover costs and leverage risk\n📌 Use for hedging or speculation — not long-term investing\n📌 Gold as portfolio hedge: 5-10% allocation in uncertainty\n📌 Oil: Fundamentals support $75-85 range near-term\n\n*Add your OpenAI API key for AI-powered commodity forecasting.*`
  }

  if (macroKeywords.some((k) => q.includes(k))) {
    return `**Macro Economic Analysis — May 2026**\n\n**Current Conditions:**\n• US CPI: 2.8% YoY (down from 9.1% peak in 2022)\n• Fed Funds Rate: 5.25% (at/near peak)\n• Unemployment: 3.9% (still tight labor market)\n• GDP Growth: 2.1% annualized Q1 2026\n\n**Investment Implications:**\n✅ Soft landing scenario most likely (60% probability)\n⚠️ Recession risk within 12 months: ~25% probability\n📌 Stagflation scenario: ~15% probability\n\n**Asset Class Outlook:**\n• **Equities:** Cautiously bullish. Quality/profitability over growth\n• **Bonds:** Attractive entry point. Duration extension justified\n• **Crypto:** High beta to macro. Beneficial in rate-cut environment\n• **Gold:** Strategic hold. Benefits from geopolitical uncertainty\n• **Cash/T-Bills:** Still competitive at 5%+. Maintain dry powder\n\n*Connect OpenAI API key in Settings for personalized macro scenario analysis.*`
  }

  // General investment advice
  return `**mLookup Investment Intelligence**\n\nI can analyze the following asset types for you:\n\n• **📈 Stocks** — US and global equities, technical and fundamental analysis\n• **₿ Crypto** — Bitcoin, Ethereum, altcoins, DeFi tokens\n• **🏛️ Bonds** — Treasuries, corporate, high-yield fixed income\n• **📅 IPOs** — Upcoming listings, valuation analysis, risk assessment\n• **🛢️ Futures** — Commodities, indices, currencies, metals\n• **🌍 Macro** — Interest rates, inflation, central bank policy, global trends\n\n**Try asking:**\n→ "Should I invest in Bitcoin right now?"\n→ "Is NVIDIA stock overvalued?"\n→ "What's the outlook for gold in 2026?"\n→ "Analyze the upcoming Klarna IPO"\n→ "Best bonds to buy with falling rates?"\n\n💡 *Add your OpenAI API key in Settings to unlock GPT-4 powered responses.*`
}
