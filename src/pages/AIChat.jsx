import { useMemo, useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Bot,
  Send,
  User,
  Loader2,
  Settings,
  Workflow,
  LineChart as LineChartIcon,
  ShieldAlert,
} from 'lucide-react'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { runChatAnalyst } from '../services/chatAnalystService'
import { formatPrice } from '../utils/format'

const QUICK_PROMPTS = [
  'Predict NVDA for 14 days',
  'Analyze Bitcoin trend for 30 days',
  'Should I buy AAPL this week?',
  'Forecast ETH next 10 days with risk',
]

const StepBadge = ({ step }) => (
  <div className="rounded-lg bg-white/5 border border-white/10 p-2.5">
    <p className="text-[11px] text-cyan-300 uppercase tracking-wider">{step.name}</p>
    <p className="text-xs text-gray-300 mt-1">{step.details}</p>
    <p className="text-[10px] text-gray-500 mt-1">t+{step.elapsedMs}ms</p>
  </div>
)

const ForecastTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dark-800 border border-white/10 rounded-lg px-3 py-2 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((row) => (
        <p key={row.dataKey} style={{ color: row.color }} className="font-mono">
          {row.name}: ${formatPrice(row.value, 4)}
        </p>
      ))}
    </div>
  )
}

const ForecastGraph = ({ forecast }) => {
  const historical = forecast.historical.slice(-35).map((point) => ({
    date: point.date,
    history: point.close,
    prediction: null,
    lower: null,
    upper: null,
  }))

  const projected = forecast.forecast.map((point) => ({
    date: point.date,
    history: null,
    prediction: point.predicted,
    lower: point.lower,
    upper: point.upper,
  }))

  const chartData = [...historical, ...projected]

  return (
    <div className="h-56 rounded-xl border border-white/10 bg-black/20 p-3">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} width={70} domain={['auto', 'auto']} />
          <Tooltip content={<ForecastTooltip />} />
          <ReferenceLine x={historical[historical.length - 1]?.date} stroke="rgba(148,163,184,0.55)" strokeDasharray="4 4" />

          <Area type="monotone" dataKey="upper" stroke="none" fill="rgba(34,211,238,0.18)" />
          <Area type="monotone" dataKey="lower" stroke="none" fill="rgba(8,14,30,0.86)" />
          <Line type="monotone" dataKey="history" name="History" stroke="#a78bfa" strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="prediction" name="Prediction" stroke="#22d3ee" strokeWidth={2.2} dot={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

const AnalystResult = ({ result }) => {
  if (!result?.forecast) return null

  const summary = result.forecast.summary

  return (
    <div className="space-y-3 mt-3">
      <ForecastGraph forecast={result.forecast} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="rounded-lg bg-white/5 border border-white/10 p-2.5">
          <p className="text-gray-500">Projected Price</p>
          <p className="text-white font-mono mt-1">${formatPrice(summary.predictedPrice)}</p>
        </div>
        <div className="rounded-lg bg-white/5 border border-white/10 p-2.5">
          <p className="text-gray-500">Expected Return</p>
          <p className={`font-semibold mt-1 ${summary.expectedReturn >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
            {summary.expectedReturn >= 0 ? '+' : ''}{formatPrice(summary.expectedReturn, 2)}%
          </p>
        </div>
        <div className="rounded-lg bg-white/5 border border-white/10 p-2.5">
          <p className="text-gray-500">Model Confidence</p>
          <p className="text-white mt-1">{summary.confidenceScore}/100</p>
        </div>
        <div className="rounded-lg bg-white/5 border border-white/10 p-2.5">
          <p className="text-gray-500">Expected Hit Rate</p>
          <p className="text-white mt-1">{formatPrice(summary.expectedDirectionalSuccessPct, 1)}%</p>
        </div>
      </div>

      <div className="rounded-lg bg-white/5 border border-white/10 p-2.5 text-xs text-gray-300">
        Recommendation: <span className="text-white font-semibold">{result.analysis?.recommendation || 'N/A'}</span>
      </div>

      {result.isSimulated && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-2.5 text-[11px] text-yellow-300">
          Stock feed is currently simulated. Add Alpha Vantage API key in Settings for live stock forecasting.
        </div>
      )}
    </div>
  )
}

const MessageBubble = ({ item }) => {
  if (item.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-xl rounded-2xl rounded-tr-sm bg-cyan-500/20 border border-cyan-500/30 px-4 py-3 text-sm text-white">
          {item.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shrink-0 mt-1">
        <Bot size={14} className="text-white" />
      </div>
      <div className="flex-1 max-w-4xl rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.04] px-4 py-3">
        {item.loading ? (
          <>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Loader2 size={14} className="animate-spin" /> Running analyst subprocesses...
            </div>
            {!!item.steps?.length && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                {item.steps.map((step) => <StepBadge key={`${item.id}-${step.name}`} step={step} />)}
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-gray-100 text-sm leading-relaxed">{item.content}</p>

            {!!item.steps?.length && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                {item.steps.map((step) => <StepBadge key={`${item.id}-${step.name}`} step={step} />)}
              </div>
            )}

            <AnalystResult result={item.result} />

            <p className="text-[11px] text-gray-500 mt-3">Source: {item.source || 'Analyst Engine'}</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function AIChat() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Chat Analyst is live. Ask a stock or crypto question and I will run intent parsing, asset resolution, data acquisition, technical analysis, and prediction engine subprocesses with graph outputs.',
      source: 'Analyst Subprocess Engine',
    },
  ])

  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const processSend = async (text) => {
    if (!text.trim() || loading) return
    const now = Date.now()
    const user = { id: now, role: 'user', content: text.trim() }
    const pending = { id: now + 1, role: 'assistant', loading: true, content: '', steps: [] }

    setMessages((prev) => [...prev, user, pending])
    setInput('')
    setLoading(true)

    try {
      const response = await runChatAnalyst(text.trim(), {
        onStep: (liveSteps) => {
          setMessages((prev) => prev.map((msg) => {
            if (msg.id !== pending.id) return msg
            return { ...msg, steps: liveSteps }
          }))
        },
      })
      setMessages((prev) => prev.map((msg) => {
        if (msg.id !== pending.id) return msg
        return {
          ...msg,
          loading: false,
          content: response.text,
          source: response.source,
          steps: response.steps,
          result: response.result,
        }
      }))
    } catch (_) {
      setMessages((prev) => prev.map((msg) => {
        if (msg.id !== pending.id) return msg
        return {
          ...msg,
          loading: false,
          content: 'Subprocess execution failed. Please retry with a clearer ticker or coin name.',
          source: 'System',
        }
      }))
    } finally {
      setLoading(false)
    }
  }

  const runButtonDisabled = loading || !input.trim()

  const usageTips = useMemo(() => [
    'Include an asset symbol or name for best accuracy.',
    'Add timeframe words like 7 days, 14 days, or month.',
    'Ask for risk, volatility, or confidence interval when needed.',
  ], [])

  return (
    <div className="h-[calc(100vh-3.5rem)] grid grid-cols-1 xl:grid-cols-[280px_1fr]">
      <aside className="hidden xl:flex flex-col border-r border-white/10 bg-black/20 p-4 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center gap-2 text-white">
            <Workflow size={15} className="text-cyan-300" />
            <h2 className="font-semibold text-sm">Subprocess Pipeline</h2>
          </div>
          <p className="text-xs text-gray-400 mt-2">Intent -&gt; Asset Resolve -&gt; Data Fetch -&gt; Technicals -&gt; Prediction -&gt; Report</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
          <div className="flex items-center gap-2 text-white">
            <LineChartIcon size={15} className="text-blue-300" />
            <h3 className="font-semibold text-sm">Usage Tips</h3>
          </div>
          {usageTips.map((tip) => (
            <p key={tip} className="text-xs text-gray-400">{tip}</p>
          ))}
        </div>

        <div className="mt-auto rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3">
          <div className="flex items-center gap-2 text-yellow-200 text-xs font-medium">
            <ShieldAlert size={14} /> Risk Notice
          </div>
          <p className="text-[11px] text-yellow-100/85 mt-1">Predictions are probabilistic and not guaranteed returns.</p>
        </div>
      </aside>

      <section className="flex flex-col min-h-0">
        <div className="border-b border-white/10 px-4 md:px-6 py-3 flex items-center justify-between bg-dark-900/75 backdrop-blur-xl">
          <div>
            <h1 className="text-white font-bold">Chat-Based Quant Analyst</h1>
            <p className="text-xs text-gray-400">Functionality-first workflow with subprocess logs and prediction graphs.</p>
          </div>
          <Link to="/settings" className="text-xs text-gray-300 hover:text-white flex items-center gap-1">
            <Settings size={13} /> API Settings
          </Link>
        </div>

        <div className="px-4 md:px-6 py-3 border-b border-white/10 overflow-x-auto">
          <div className="flex gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => processSend(prompt)}
                disabled={loading}
                className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:border-white/20 disabled:opacity-40"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
          {messages.map((item) => <MessageBubble key={item.id} item={item} />)}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-white/10 px-4 md:px-6 py-4 bg-dark-900/70 backdrop-blur-xl">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              processSend(input)
            }}
            className="flex gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hidden sm:flex items-center justify-center">
              <User size={16} className="text-gray-400" />
            </div>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a market question. Example: Forecast TSLA for 30 days and show risk."
              className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-500/50"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={runButtonDisabled}
              className="px-4 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
          <p className="text-[10px] text-gray-500 mt-2 text-center">For informational use only. Not investment advice.</p>
        </div>
      </section>
    </div>
  )
}
