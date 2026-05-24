export const formatPrice = (price, decimals) => {
  if (price === null || price === undefined) return 'N/A'
  const p = parseFloat(price)
  if (isNaN(p)) return 'N/A'
  if (decimals !== undefined) return p.toFixed(decimals)
  if (p >= 1000) return p.toLocaleString('en-US', { maximumFractionDigits: 2 })
  if (p >= 1) return p.toFixed(2)
  if (p >= 0.01) return p.toFixed(4)
  return p.toFixed(8)
}

export const formatMarketCap = (value) => {
  if (!value) return 'N/A'
  const v = parseFloat(value)
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`
  return `$${v.toLocaleString()}`
}

export const formatVolume = (value) => {
  if (!value) return 'N/A'
  const v = parseFloat(value)
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`
  return v.toString()
}

export const formatNumber = (value, compact = false) => {
  if (value === null || value === undefined) return 'N/A'
  const v = parseFloat(value)
  if (isNaN(v)) return 'N/A'
  if (compact) {
    if (v >= 1e12) return `${(v / 1e12).toFixed(1)}T`
    if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`
    if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`
  }
  return v.toLocaleString()
}

export const getSentimentColor = (score) => {
  if (score >= 70) return 'text-green-400'
  if (score >= 55) return 'text-emerald-400'
  if (score >= 45) return 'text-gray-400'
  if (score >= 30) return 'text-orange-400'
  return 'text-red-400'
}

export const getRecommendationStyle = (rec) => {
  if (rec === 'BUY') return { bg: 'bg-green-500/20', border: 'border-green-500/40', text: 'text-green-400' }
  if (rec === 'SELL') return { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400' }
  return { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-400' }
}
