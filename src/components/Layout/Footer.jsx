export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-dark-900/80 mt-auto py-6 px-4">
      <div className="max-w-screen-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <span className="text-white font-black text-[10px]">m</span>
          </div>
          <span className="font-semibold text-gray-400">mLookup</span>
          <span>— AI Market Intelligence Platform</span>
        </div>
        <div className="text-center">
          ⚠️ <strong className="text-gray-400">Disclaimer:</strong> Data is for informational purposes only. Not financial advice. Always do your own research.
        </div>
        <div className="text-gray-600">
          Crypto: CoinGecko API &nbsp;|&nbsp; Stocks: Alpha Vantage
        </div>
      </div>
    </footer>
  )
}
