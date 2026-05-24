import { useState } from 'react'
import { setApiKey, getApiKeys } from '../config/apiConfig'
import { Save, Eye, EyeOff, CheckCircle, ExternalLink, Key } from 'lucide-react'
import { getPredictorConfig, setPredictorConfig, resetPredictorConfig } from '../config/predictorConfig'

const API_CONFIGS = [
  {
    key: 'alpha_vantage_key',
    label: 'Alpha Vantage API Key',
    placeholder: 'Enter your Alpha Vantage API key',
    url: 'https://www.alphavantage.co/support/#api-key',
    description: 'Free tier: 25 requests/day. Unlocks real-time US stock quotes, historical data, and stock search.',
    icon: '📈',
  },
  {
    key: 'finnhub_key',
    label: 'Finnhub API Key',
    placeholder: 'Enter your Finnhub API key',
    url: 'https://finnhub.io/register',
    description: 'Free tier: 60 API calls/minute. Provides real-time stock data, company news, and earnings data.',
    icon: '🏦',
  },
  {
    key: 'news_api_key',
    label: 'NewsAPI Key',
    placeholder: 'Enter your NewsAPI key',
    url: 'https://newsapi.org/register',
    description: 'Free tier: 100 requests/day. Unlocks live financial news from hundreds of sources.',
    icon: '📰',
  },
  {
    key: 'openai_key',
    label: 'OpenAI API Key',
    placeholder: 'sk-...',
    url: 'https://platform.openai.com/api-keys',
    description: 'Unlocks GPT-4o Mini powered AI responses in the AI Advisor. Usage-based pricing (~$0.001/query).',
    icon: '🤖',
    sensitive: true,
  },
]

const KeyField = ({ config }) => {
  const [value, setValue] = useState(getApiKeys()[config.key.replace('_key', '').replace(/_([a-z])/g, (_, c) => c.toUpperCase())] || '')
  const [show, setShow] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setApiKey(config.key, value.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h3 className="text-white font-semibold text-sm">{config.label}</h3>
            <p className="text-gray-400 text-xs mt-0.5">{config.description}</p>
          </div>
        </div>
        <a
          href={config.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 shrink-0 ml-4"
        >
          Get Key <ExternalLink size={10} />
        </a>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={config.placeholder}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-3 pr-10 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500/50 font-mono"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            saved ? 'bg-green-500/20 text-green-300 border border-green-500/20' : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {saved ? <><CheckCircle size={14} /> Saved</> : <><Save size={14} /> Save</>}
        </button>
      </div>
      {value && (
        <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
          <CheckCircle size={10} /> API key configured
        </p>
      )}
    </div>
  )
}

export default function Settings() {
  const predictor = getPredictorConfig()
  const [predictorDraft, setPredictorDraft] = useState({
    defaultHorizonDays: predictor.defaultHorizonDays,
    defaultConfidence: predictor.defaultConfidence,
    horizonOptions: predictor.horizonOptions.join(', '),
    confidenceOptions: predictor.confidenceOptions.join(', '),
    backtestHorizons: predictor.backtestHorizons.join(', '),
    modelLabStockCount: predictor.modelLabStockCount,
    modelLabCryptoCount: predictor.modelLabCryptoCount,
  })
  const [predictorSaved, setPredictorSaved] = useState(false)

  const handleClearAll = () => {
    if (confirm('Clear all stored API keys?')) {
      ['alpha_vantage_key', 'finnhub_key', 'news_api_key', 'openai_key'].forEach((k) => {
        localStorage.removeItem(`mlookup_${k}`)
      })
      window.location.reload()
    }
  }

  const parseNumberList = (raw) => {
    return String(raw)
      .split(',')
      .map((v) => Number(v.trim()))
      .filter((v) => Number.isFinite(v))
  }

  const handleSavePredictor = () => {
    setPredictorConfig({
      defaultHorizonDays: Number(predictorDraft.defaultHorizonDays),
      defaultConfidence: Number(predictorDraft.defaultConfidence),
      horizonOptions: parseNumberList(predictorDraft.horizonOptions),
      confidenceOptions: parseNumberList(predictorDraft.confidenceOptions),
      backtestHorizons: parseNumberList(predictorDraft.backtestHorizons),
      modelLabStockCount: Number(predictorDraft.modelLabStockCount),
      modelLabCryptoCount: Number(predictorDraft.modelLabCryptoCount),
    })
    setPredictorSaved(true)
    setTimeout(() => setPredictorSaved(false), 1500)
  }

  const handleResetPredictor = () => {
    const next = resetPredictorConfig()
    setPredictorDraft({
      defaultHorizonDays: next.defaultHorizonDays,
      defaultConfidence: next.defaultConfidence,
      horizonOptions: next.horizonOptions.join(', '),
      confidenceOptions: next.confidenceOptions.join(', '),
      backtestHorizons: next.backtestHorizons.join(', '),
      modelLabStockCount: next.modelLabStockCount,
      modelLabCryptoCount: next.modelLabCryptoCount,
    })
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Settings & API Keys</h1>
        <p className="text-gray-400 text-sm">
          Keys are stored locally in your browser — never sent to any server.
        </p>
      </div>

      {/* Security note */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <Key size={16} className="text-blue-400 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-blue-300 font-semibold">Privacy First</p>
          <p className="text-gray-400 text-xs mt-0.5">
            All API keys are stored only in your browser's localStorage. They are never transmitted to any mLookup server. You can clear them at any time.
          </p>
        </div>
      </div>

      {/* What works without keys */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-white font-semibold mb-3 text-sm">What works without API keys</h3>
        <div className="space-y-1.5 text-xs text-gray-400">
          {[
            '✅ Full CoinGecko crypto market data (100% free, no key needed)',
            '✅ Fear & Greed Index (free)',
            '✅ Curated financial news (built-in)',
            '✅ Simulated stock prices (20 top US stocks)',
            '✅ Technical analysis engine (RSI, SMA, Bollinger Bands, MACD)',
            '✅ AI investment recommendations (rule-based engine)',
            '✅ IPO calendar & analysis',
            '✅ Bonds, Futures & Forex data (curated)',
          ].map((item) => (
            <div key={item}>{item}</div>
          ))}
        </div>
      </div>

      {/* API Key fields */}
      <div className="space-y-4">
        <h3 className="text-white font-semibold text-sm">API Keys (optional enhancements)</h3>
        {API_CONFIGS.map((config) => (
          <KeyField key={config.key} config={config} />
        ))}
      </div>

      <div className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="text-white font-semibold text-sm">Predictor Configuration</h3>
        <p className="text-gray-400 text-xs">
          Configure forecast horizons, confidence options, and model-lab asset counts without code changes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <p className="text-gray-500 text-xs mb-1">Default Horizon (days)</p>
            <input
              type="number"
              value={predictorDraft.defaultHorizonDays}
              onChange={(e) => setPredictorDraft((prev) => ({ ...prev, defaultHorizonDays: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Default Confidence (0-1)</p>
            <input
              type="number"
              step="0.01"
              value={predictorDraft.defaultConfidence}
              onChange={(e) => setPredictorDraft((prev) => ({ ...prev, defaultConfidence: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Horizon Options (comma separated)</p>
            <input
              value={predictorDraft.horizonOptions}
              onChange={(e) => setPredictorDraft((prev) => ({ ...prev, horizonOptions: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Confidence Options (comma separated)</p>
            <input
              value={predictorDraft.confidenceOptions}
              onChange={(e) => setPredictorDraft((prev) => ({ ...prev, confidenceOptions: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Backtest Horizons (comma separated)</p>
            <input
              value={predictorDraft.backtestHorizons}
              onChange={(e) => setPredictorDraft((prev) => ({ ...prev, backtestHorizons: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Model Lab Assets (Stocks / Crypto)</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={predictorDraft.modelLabStockCount}
                onChange={(e) => setPredictorDraft((prev) => ({ ...prev, modelLabStockCount: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              />
              <input
                type="number"
                value={predictorDraft.modelLabCryptoCount}
                onChange={(e) => setPredictorDraft((prev) => ({ ...prev, modelLabCryptoCount: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSavePredictor}
            className={`px-4 py-2 rounded-lg text-sm ${predictorSaved ? 'bg-green-500/20 text-green-300 border border-green-500/20' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}
          >
            {predictorSaved ? 'Saved' : 'Save Predictor Config'}
          </button>
          <button
            onClick={handleResetPredictor}
            className="px-4 py-2 rounded-lg text-sm border border-white/15 text-gray-300 hover:text-white"
          >
            Reset Predictor Config
          </button>
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={handleClearAll}
          className="text-red-400 hover:text-red-300 text-sm border border-red-400/20 hover:border-red-400/40 px-4 py-2 rounded-lg transition-colors"
        >
          Clear All API Keys
        </button>
      </div>
    </div>
  )
}
