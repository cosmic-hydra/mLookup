import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function PriceChange({ value, showIcon = true, size = 'sm', suffix = '%' }) {
  const v = parseFloat(value)
  const isPos = v > 0
  const isNeg = v < 0

  const colorClass = isPos ? 'text-green-400' : isNeg ? 'text-red-400' : 'text-gray-400'
  const bgClass = isPos ? 'bg-green-400/10' : isNeg ? 'bg-red-400/10' : 'bg-gray-400/10'
  const sizeClass = size === 'lg' ? 'text-base font-semibold' : size === 'md' ? 'text-sm font-medium' : 'text-xs font-medium'
  const iconSize = size === 'lg' ? 16 : 12

  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded ${bgClass} ${colorClass} ${sizeClass} font-mono`}>
      {showIcon && (
        isPos ? <TrendingUp size={iconSize} /> : isNeg ? <TrendingDown size={iconSize} /> : <Minus size={iconSize} />
      )}
      {isPos ? '+' : ''}{isNaN(v) ? 'N/A' : v.toFixed(2)}{suffix}
    </span>
  )
}
