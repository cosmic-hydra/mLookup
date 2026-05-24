const DAY_MS = 24 * 60 * 60 * 1000
import { getPredictorConfig } from '../config/predictorConfig'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const toSeries = (history = []) => {
  return history
    .map((point) => {
      const close = Number(point?.close ?? point?.price ?? point?.value)
      const high = Number(point?.high ?? close)
      const low = Number(point?.low ?? close)
      const volume = Number(point?.volume ?? 0)
      return {
        date: point?.date,
        close: Number.isFinite(close) ? close : null,
        high: Number.isFinite(high) ? high : null,
        low: Number.isFinite(low) ? low : null,
        volume: Number.isFinite(volume) ? volume : 0,
      }
    })
    .filter((point) => point.close !== null)
}

const average = (values) => {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

const stdDev = (values) => {
  if (values.length < 2) return 0
  const mean = average(values)
  const variance = average(values.map((value) => (value - mean) ** 2))
  return Math.sqrt(variance)
}

const linearSlope = (values) => {
  if (values.length < 2) return 0
  const n = values.length
  const xMean = (n - 1) / 2
  const yMean = average(values)

  let numerator = 0
  let denominator = 0

  for (let i = 0; i < n; i += 1) {
    const xDiff = i - xMean
    numerator += xDiff * (values[i] - yMean)
    denominator += xDiff * xDiff
  }

  return denominator ? numerator / denominator : 0
}

const ema = (values, period) => {
  if (!values.length) return 0
  const alpha = 2 / (period + 1)
  return values.slice(1).reduce((acc, value) => alpha * value + (1 - alpha) * acc, values[0])
}

const zScoreByConfidence = (confidence) => {
  if (confidence >= 0.99) return 2.58
  if (confidence >= 0.95) return 1.96
  if (confidence >= 0.9) return 1.64
  return 1.28
}

const dateLabelFrom = (dateLike, step) => {
  if (!dateLike) return `T+${step}`
  const date = new Date(dateLike)
  if (Number.isNaN(date.getTime())) return `T+${step}`
  const next = new Date(date.getTime() + step * DAY_MS)
  return next.toISOString().split('T')[0]
}

const computeLogReturns = (prices) => {
  const returns = []
  for (let i = 1; i < prices.length; i += 1) {
    const prev = prices[i - 1]
    const next = prices[i]
    if (prev > 0 && next > 0) returns.push(Math.log(next / prev))
  }
  return returns
}

const last = (values) => values[values.length - 1]

const safeSlice = (values, n) => values.slice(Math.max(values.length - n, 0))

const calcRSIFromPrices = (prices, period = 14) => {
  if (prices.length < period + 1) return 50
  let gains = 0
  let losses = 0
  for (let i = 1; i <= period; i += 1) {
    const diff = prices[i] - prices[i - 1]
    if (diff >= 0) gains += diff
    else losses -= diff
  }
  let avgGain = gains / period
  let avgLoss = losses / period
  for (let i = period + 1; i < prices.length; i += 1) {
    const diff = prices[i] - prices[i - 1]
    const gain = diff > 0 ? diff : 0
    const loss = diff < 0 ? -diff : 0
    avgGain = ((period - 1) * avgGain + gain) / period
    avgLoss = ((period - 1) * avgLoss + loss) / period
  }
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - (100 / (1 + rs))
}

const calcMACDFromPrices = (prices) => {
  if (prices.length < 26) return { macd: 0, signal: 0, histogram: 0 }
  const ema12 = ema(prices, 12)
  const ema26 = ema(prices, 26)
  const macd = ema12 - ema26
  const signal = ema(prices.map(() => macd), 9)
  return {
    macd,
    signal,
    histogram: macd - signal,
  }
}

const calcATRFromSeries = (series, period = 14) => {
  if (series.length < period + 1) return 0
  const trueRanges = []
  for (let i = 1; i < series.length; i += 1) {
    const current = series[i]
    const prevClose = series[i - 1].close
    const tr1 = Math.abs((current.high ?? current.close) - (current.low ?? current.close))
    const tr2 = Math.abs((current.high ?? current.close) - prevClose)
    const tr3 = Math.abs((current.low ?? current.close) - prevClose)
    trueRanges.push(Math.max(tr1, tr2, tr3))
  }
  return average(safeSlice(trueRanges, period))
}

const volumeRegimeFactor = (series) => {
  const volumes = series.map((point) => point.volume || 0).filter((v) => v > 0)
  if (volumes.length < 15) return 1
  const fast = average(safeSlice(volumes, 5))
  const slow = average(safeSlice(volumes, 20)) || fast || 1
  const ratio = fast / slow
  return clamp(ratio, 0.6, 1.6)
}

const inferVolatilityRegime = (prices) => {
  const returns = computeLogReturns(prices)
  const vol = stdDev(safeSlice(returns, 30))
  if (vol > 0.06) return 'extreme'
  if (vol > 0.035) return 'high'
  if (vol < 0.012) return 'low'
  return 'normal'
}

const composeDailyDrift = (prices) => {
  const returns = computeLogReturns(prices)

  const vol = stdDev(returns)
  const baseDrift = average(returns)

  const trendWindow = prices.slice(-30)
  const trendSlope = linearSlope(trendWindow)
  const trendDrift = trendWindow[trendWindow.length - 1] > 0
    ? trendSlope / trendWindow[trendWindow.length - 1]
    : 0

  const shortEma = ema(prices.slice(-12), 5)
  const longEma = ema(prices.slice(-40), 18)
  const momentumDrift = longEma > 0 ? (shortEma - longEma) / longEma : 0

  const longMean = average(prices.slice(-50))
  const current = prices[prices.length - 1]
  const meanReversion = longMean > 0 ? (longMean - current) / longMean : 0

  const drift =
    baseDrift * 0.45 +
    trendDrift * 0.3 +
    momentumDrift * 0.2 +
    meanReversion * 0.05

  const boundedDrift = clamp(drift, -0.08, 0.08)
  const boundedVol = clamp(vol || 0.015, 0.005, 0.18)

  return {
    drift: boundedDrift,
    volatility: boundedVol,
    trendStrength: clamp(Math.abs(trendDrift) * 150, 0, 1),
  }
}

const predictTrendStep = (prices) => {
  const { drift, volatility, trendStrength } = composeDailyDrift(prices)
  const current = last(prices)
  const noisePenalty = 0.5 * volatility * volatility
  const next = current * Math.exp(drift - noisePenalty)
  return {
    price: next,
    volatility,
    trendStrength,
  }
}

const predictRegimeStep = (prices, featureSnapshot = {}) => {
  const current = last(prices)
  const returns = computeLogReturns(prices)

  if (!returns.length) {
    return {
      price: current,
      volatility: 0.015,
      trendStrength: 0,
    }
  }

  const mom5 = average(safeSlice(returns, 5))
  const mom20 = average(safeSlice(returns, 20))
  const vol20 = stdDev(safeSlice(returns, 20))

  const rsi = calcRSIFromPrices(prices)
  const macd = calcMACDFromPrices(prices)
  const rsiBias = (50 - rsi) / 100
  const macdBias = macd.histogram / Math.max(current, 1)
  const atrPct = featureSnapshot.atrPct || 0.015
  const volumeFactor = featureSnapshot.volumeFactor || 1

  const mean20 = average(safeSlice(prices, 20))
  const std20 = stdDev(safeSlice(prices, 20))
  const zScore = std20 > 0 ? (current - mean20) / std20 : 0

  const regimeReturn =
    mom5 * 0.36 +
    mom20 * 0.22 +
    (-zScore * vol20) * 0.24 +
    rsiBias * vol20 * 0.8 +
    macdBias * 0.65

  const boundedReturn = clamp(regimeReturn, -0.08, 0.08)
  const boundedVol = clamp((vol20 || 0.015) * (1 + atrPct * 3) / Math.sqrt(volumeFactor), 0.005, 0.2)

  return {
    price: current * Math.exp(boundedReturn),
    volatility: boundedVol,
    trendStrength: clamp(Math.abs(mom20) * 200, 0, 1),
  }
}

const evaluatePredictor = (prices, predictor, featureSnapshot = {}) => {
  if (prices.length < 32) {
    return {
      mae: null,
      mape: null,
      rmse: null,
      directionalAccuracy: null,
      correctDirection: 0,
      sampleSize: 0,
    }
  }

  const minTrain = 24
  const preds = []

  for (let i = minTrain; i < prices.length - 1; i += 1) {
    const train = prices.slice(0, i + 1)
    const output = predictor(train, featureSnapshot)
    preds.push({
      predicted: output.price,
      actual: prices[i + 1],
      prev: prices[i],
    })
  }

  if (!preds.length) {
    return {
      mae: null,
      mape: null,
      rmse: null,
      directionalAccuracy: null,
      correctDirection: 0,
      sampleSize: 0,
    }
  }

  const absErrors = preds.map((row) => Math.abs(row.predicted - row.actual))
  const sqErrors = preds.map((row) => (row.predicted - row.actual) ** 2)
  const pctErrors = preds
    .filter((row) => row.actual !== 0)
    .map((row) => Math.abs((row.predicted - row.actual) / row.actual))

  let correctDirection = 0
  preds.forEach((row) => {
    const actualDir = Math.sign(row.actual - row.prev)
    const predDir = Math.sign(row.predicted - row.prev)
    if (actualDir === predDir) correctDirection += 1
  })

  return {
    mae: average(absErrors),
    mape: pctErrors.length ? average(pctErrors) * 100 : null,
    rmse: Math.sqrt(average(sqErrors)),
    directionalAccuracy: (correctDirection / preds.length) * 100,
    correctDirection,
    sampleSize: preds.length,
  }
}

const modelQualityScore = (metrics) => {
  if (!metrics.sampleSize) return 50
  const directional = metrics.directionalAccuracy || 50
  const mapePenalty = Math.min(metrics.mape || 25, 40)
  const errorComponent = 100 - mapePenalty * 2
  return clamp(directional * 0.65 + errorComponent * 0.35, 5, 95)
}

const chooseModelWeights = (prices, context = {}) => {
  const { assetClass = 'mixed', featureSnapshot = {} } = context
  const trendMetrics = evaluatePredictor(prices, predictTrendStep, featureSnapshot)
  const regimeMetrics = evaluatePredictor(prices, predictRegimeStep, featureSnapshot)

  const trendScore = modelQualityScore(trendMetrics)
  const regimeScore = modelQualityScore(regimeMetrics)
  const volatilityRegime = inferVolatilityRegime(prices)

  const priorsByAsset = {
    crypto: { trend: 0.56, regime: 0.44 },
    stock: { trend: 0.48, regime: 0.52 },
    mixed: { trend: 0.5, regime: 0.5 },
  }

  const prior = priorsByAsset[assetClass] || priorsByAsset.mixed
  const volAdj = volatilityRegime === 'extreme'
    ? { trend: 0.38, regime: 0.62 }
    : volatilityRegime === 'low'
      ? { trend: 0.6, regime: 0.4 }
      : { trend: 0.5, regime: 0.5 }

  const trendBlended = trendScore * 0.72 + prior.trend * 100 * 0.18 + volAdj.trend * 100 * 0.1
  const regimeBlended = regimeScore * 0.72 + prior.regime * 100 * 0.18 + volAdj.regime * 100 * 0.1

  const total = trendBlended + regimeBlended

  const trendWeight = total > 0 ? trendBlended / total : 0.5
  const regimeWeight = total > 0 ? regimeBlended / total : 0.5

  return {
    trendWeight,
    regimeWeight,
    trendMetrics,
    regimeMetrics,
    volatilityRegime,
  }
}

const buildForecastPath = ({ prices, horizonDays, confidence, context = {} }) => {
  const { featureSnapshot = {} } = context
  const { trendWeight, regimeWeight, trendMetrics, regimeMetrics, volatilityRegime } = chooseModelWeights(prices, context)

  const zScore = zScoreByConfidence(confidence)

  const points = []
  const forecastHistory = [...prices]
  let projected = last(forecastHistory)
  let rollingVol = stdDev(computeLogReturns(safeSlice(forecastHistory, 30))) || 0.015
  let rollingTrendStrength = 0.5

  for (let step = 1; step <= horizonDays; step += 1) {
    const trendStep = predictTrendStep(forecastHistory)
    const regimeStep = predictRegimeStep(forecastHistory, featureSnapshot)

    const disagreement = Math.abs(trendStep.price - regimeStep.price) / Math.max(projected, 1)
    projected = trendStep.price * trendWeight + regimeStep.price * regimeWeight

    rollingVol = clamp(
      trendStep.volatility * trendWeight + regimeStep.volatility * regimeWeight,
      0.005,
      0.22
    )
    rollingTrendStrength = clamp(
      trendStep.trendStrength * trendWeight + regimeStep.trendStrength * regimeWeight,
      0,
      1
    )

    const interval = zScore * rollingVol * Math.sqrt(step) * (1 + disagreement * 1.8)
    const lower = projected * Math.exp(-interval)
    const upper = projected * Math.exp(interval)

    points.push({
      step,
      predicted: projected,
      lower,
      upper,
    })

    forecastHistory.push(projected)
  }

  const ensembleMetrics = evaluatePredictor(prices, (historySlice) => {
    const trend = predictTrendStep(historySlice)
    const regime = predictRegimeStep(historySlice, featureSnapshot)
    return {
      price: trend.price * trendWeight + regime.price * regimeWeight,
    }
  }, featureSnapshot)

  return {
    points,
    volatility: rollingVol,
    trendStrength: rollingTrendStrength,
    weights: {
      trend: trendWeight,
      regime: regimeWeight,
    },
    volatilityRegime,
    metrics: {
      ensemble: ensembleMetrics,
      trend: trendMetrics,
      regime: regimeMetrics,
    },
  }
}

const simulateEnsembleForecastPrice = ({ trainPrices, horizonDays, context = {} }) => {
  const { featureSnapshot = {} } = context
  const weights = chooseModelWeights(trainPrices, context)
  const path = [...trainPrices]
  let projected = last(path)
  for (let step = 0; step < horizonDays; step += 1) {
    const trend = predictTrendStep(path)
    const regime = predictRegimeStep(path, featureSnapshot)
    projected = trend.price * weights.trendWeight + regime.price * weights.regimeWeight
    path.push(projected)
  }
  return projected
}

const evaluateHorizonBacktest = ({ prices, horizonDays, context = {} }) => {
  const minTrain = 28
  if (prices.length < minTrain + horizonDays + 2) {
    return {
      horizonDays,
      mae: null,
      mape: null,
      rmse: null,
      directionalAccuracy: null,
      sampleSize: 0,
      correctDirection: 0,
    }
  }

  const rows = []
  for (let i = minTrain; i + horizonDays < prices.length; i += 1) {
    const train = prices.slice(0, i + 1)
    const predicted = simulateEnsembleForecastPrice({ trainPrices: train, horizonDays, context })
    const actual = prices[i + horizonDays]
    const anchor = prices[i]
    rows.push({ predicted, actual, anchor })
  }

  if (!rows.length) {
    return {
      horizonDays,
      mae: null,
      mape: null,
      rmse: null,
      directionalAccuracy: null,
      sampleSize: 0,
      correctDirection: 0,
    }
  }

  const absErrors = rows.map((row) => Math.abs(row.predicted - row.actual))
  const sqErrors = rows.map((row) => (row.predicted - row.actual) ** 2)
  const pctErrors = rows.filter((row) => row.actual !== 0).map((row) => Math.abs((row.predicted - row.actual) / row.actual))
  let correctDirection = 0
  rows.forEach((row) => {
    const actualDir = Math.sign(row.actual - row.anchor)
    const predDir = Math.sign(row.predicted - row.anchor)
    if (actualDir === predDir) correctDirection += 1
  })

  return {
    horizonDays,
    mae: average(absErrors),
    mape: pctErrors.length ? average(pctErrors) * 100 : null,
    rmse: Math.sqrt(average(sqErrors)),
    directionalAccuracy: (correctDirection / rows.length) * 100,
    sampleSize: rows.length,
    correctDirection,
  }
}

const calibrateFromHorizonBacktests = (backtests) => {
  const valid = backtests.filter((b) => b.sampleSize > 0)
  if (!valid.length) {
    return {
      calibrationFactor: 1,
      weightedHitRate: 50,
    }
  }

  const totalWeight = valid.reduce((acc, b) => acc + Math.sqrt(b.sampleSize), 0)
  const weightedHitRate = valid.reduce((acc, b) => acc + (b.directionalAccuracy || 50) * Math.sqrt(b.sampleSize), 0) / totalWeight
  const weightedMape = valid.reduce((acc, b) => acc + (b.mape || 30) * Math.sqrt(b.sampleSize), 0) / totalWeight

  const calibrationFactor = clamp((weightedHitRate / 100) * (1 - Math.min(weightedMape, 45) / 65), 0.55, 1.05)

  return {
    calibrationFactor,
    weightedHitRate,
  }
}

const reliabilityFromMetrics = (metrics) => {
  if (!metrics.sampleSize) {
    return {
      reliabilityPct: 50,
      expectedDirectionalSuccessPct: 50,
    }
  }

  const directionalProb = (metrics.correctDirection + 1) / (metrics.sampleSize + 2)
  const expectedDirectionalSuccessPct = directionalProb * 100

  const mapePenalty = Math.min(metrics.mape || 30, 45)
  const rmsePenalty = Math.min(metrics.rmse || 0, 100)

  const reliabilityPct = clamp(
    expectedDirectionalSuccessPct * 0.7 + (100 - mapePenalty * 1.2) * 0.2 + (100 - rmsePenalty * 0.2) * 0.1,
    30,
    96
  )

  return {
    reliabilityPct,
    expectedDirectionalSuccessPct,
  }
}

export const forecastPrices = ({
  history = [],
  horizonDays = 14,
  confidence = 0.9,
  currentPrice,
  assetClass = 'mixed',
} = {}) => {
  const config = getPredictorConfig()
  const series = toSeries(history)
  if (series.length < 20) {
    return {
      ready: false,
      reason: 'Need at least 20 historical points for a stable forecast.',
      series,
    }
  }

  const prices = series.map((point) => point.close)
  const basePrice = Number.isFinite(Number(currentPrice)) ? Number(currentPrice) : prices[prices.length - 1]

  const atrValue = calcATRFromSeries(series)
  const featureSnapshot = {
    atrPct: basePrice > 0 ? atrValue / basePrice : 0.015,
    volumeFactor: volumeRegimeFactor(series),
  }

  const cappedHorizon = clamp(Math.round(horizonDays), config.minHorizonDays, config.maxHorizonDays)
  const boundedConfidence = clamp(confidence, 0.8, 0.99)

  const forecast = buildForecastPath({
    prices,
    horizonDays: cappedHorizon,
    confidence: boundedConfidence,
    context: { assetClass, featureSnapshot },
  })

  const multiHorizonBacktest = config.backtestHorizons.map((h) => evaluateHorizonBacktest({
    prices,
    horizonDays: h,
    context: { assetClass, featureSnapshot },
  }))

  const calibration = calibrateFromHorizonBacktests(multiHorizonBacktest)

  const lastDate = series[series.length - 1]?.date
  const annotatedForecast = forecast.points.map((point) => ({
    ...point,
    date: dateLabelFrom(lastDate, point.step),
  }))

  const lastPrediction = annotatedForecast[annotatedForecast.length - 1]
  const expectedReturn = ((lastPrediction.predicted - basePrice) / basePrice) * 100

  const metrics = forecast.metrics.ensemble
  const reliability = reliabilityFromMetrics(metrics)

  const calibratedExpectedReturn = expectedReturn * calibration.calibrationFactor

  const confidenceScoreRaw = metrics.directionalAccuracy === null
    ? 55 + forecast.trendStrength * 30
    : metrics.directionalAccuracy * 0.65 + (100 - Math.min(metrics.mape || 45, 45) * 1.2) * 0.35

  const confidenceScore = clamp(Math.round(confidenceScoreRaw), 35, 95)

  return {
    ready: true,
    model: 'Adaptive Ensemble Forecast v2',
    horizonDays: cappedHorizon,
    confidence: boundedConfidence,
    currentPrice: basePrice,
    forecast: annotatedForecast,
    summary: {
      predictedPrice: lastPrediction.predicted,
      lowerBound: lastPrediction.lower,
      upperBound: lastPrediction.upper,
      expectedReturn,
      calibratedExpectedReturn,
      trendStrength: forecast.trendStrength,
      dailyVolatilityPct: forecast.volatility * 100,
      confidenceScore,
      reliabilityPct: reliability.reliabilityPct,
      expectedDirectionalSuccessPct: reliability.expectedDirectionalSuccessPct,
      weightedBacktestHitRatePct: calibration.weightedHitRate,
      volatilityRegime: forecast.volatilityRegime,
      modelBlend: {
        trendWeight: forecast.weights.trend,
        regimeWeight: forecast.weights.regime,
      },
    },
    metrics,
    subModelMetrics: {
      trend: forecast.metrics.trend,
      regime: forecast.metrics.regime,
    },
    multiHorizonBacktest,
    historical: series,
  }
}
