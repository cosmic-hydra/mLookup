const STORAGE_KEY = 'mlookup_predictor_config'

const DEFAULT_CONFIG = {
  minHorizonDays: 3,
  maxHorizonDays: 90,
  defaultHorizonDays: 14,
  horizonOptions: [7, 14, 30],
  confidenceOptions: [0.8, 0.9, 0.95],
  defaultConfidence: 0.9,
  backtestHorizons: [7, 14, 30],
  modelLabStockCount: 2,
  modelLabCryptoCount: 2,
}

const isPositiveNumber = (value) => Number.isFinite(value) && value > 0

const normalizeNumberArray = (value, fallback) => {
  if (!Array.isArray(value) || !value.length) return fallback
  const normalized = value
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v))
  return normalized.length ? normalized : fallback
}

export const getPredictorConfig = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_CONFIG }
    const parsed = JSON.parse(raw)

    const merged = {
      ...DEFAULT_CONFIG,
      ...parsed,
      horizonOptions: normalizeNumberArray(parsed?.horizonOptions, DEFAULT_CONFIG.horizonOptions),
      confidenceOptions: normalizeNumberArray(parsed?.confidenceOptions, DEFAULT_CONFIG.confidenceOptions),
      backtestHorizons: normalizeNumberArray(parsed?.backtestHorizons, DEFAULT_CONFIG.backtestHorizons),
    }

    if (!isPositiveNumber(merged.minHorizonDays)) merged.minHorizonDays = DEFAULT_CONFIG.minHorizonDays
    if (!isPositiveNumber(merged.maxHorizonDays)) merged.maxHorizonDays = DEFAULT_CONFIG.maxHorizonDays
    if (!isPositiveNumber(merged.defaultHorizonDays)) merged.defaultHorizonDays = DEFAULT_CONFIG.defaultHorizonDays
    if (!Number.isFinite(Number(merged.defaultConfidence))) merged.defaultConfidence = DEFAULT_CONFIG.defaultConfidence
    if (!isPositiveNumber(merged.modelLabStockCount)) merged.modelLabStockCount = DEFAULT_CONFIG.modelLabStockCount
    if (!isPositiveNumber(merged.modelLabCryptoCount)) merged.modelLabCryptoCount = DEFAULT_CONFIG.modelLabCryptoCount

    merged.defaultHorizonDays = Math.round(Math.min(Math.max(merged.defaultHorizonDays, merged.minHorizonDays), merged.maxHorizonDays))
    merged.defaultConfidence = Math.min(Math.max(Number(merged.defaultConfidence), 0.5), 0.99)
    merged.modelLabStockCount = Math.round(Math.min(Math.max(merged.modelLabStockCount, 1), 10))
    merged.modelLabCryptoCount = Math.round(Math.min(Math.max(merged.modelLabCryptoCount, 1), 10))

    return merged
  } catch (_) {
    return { ...DEFAULT_CONFIG }
  }
}

export const setPredictorConfig = (nextConfig) => {
  const current = getPredictorConfig()
  const merged = { ...current, ...nextConfig }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  return getPredictorConfig()
}

export const resetPredictorConfig = () => {
  localStorage.removeItem(STORAGE_KEY)
  return { ...DEFAULT_CONFIG }
}

export const getDefaultPredictorConfig = () => ({ ...DEFAULT_CONFIG })
