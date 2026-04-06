import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const features = [
  {
    title: 'Weather Intelligence',
    description: 'GEFS ensemble forecasts with 31 members and Welford online calibration. Probabilistic edge detection across 11 cities.',
    badge: 'WX',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  {
    title: 'Copy Trading',
    description: 'Mirror top Polymarket traders with proportional sizing. 50% exit detection and automatic position management.',
    badge: 'CT',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  {
    title: 'Multi-Mode Trading',
    description: 'Paper, Testnet, and Live modes with EIP-712 signing. Full Kelly criterion sizing with configurable fractional Kelly.',
    badge: 'MT',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
]

const steps = [
  { step: '01', title: 'Scan', description: 'Continuous market scanning across Polymarket and Kalshi. BTC 5-min windows + weather temperature markets.' },
  { step: '02', title: 'Signal', description: 'Composite signal generation with RSI, momentum, VWAP, and ensemble forecasts. Edge and confidence scoring.' },
  { step: '03', title: 'Execute', description: 'Automated trade execution with fractional Kelly sizing, daily loss limits, and real-time settlement tracking.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-black text-neutral-200 font-mono">
      {/* Nav */}
      <nav className="border-b border-neutral-800 px-6 py-3 flex items-center justify-between">
        <span className="text-xs font-bold text-neutral-100 uppercase tracking-[0.3em]">PolyEdge</span>
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="text-[10px] text-neutral-500 hover:text-green-500 uppercase tracking-wider transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/admin"
            className="text-[10px] text-neutral-500 hover:text-green-500 uppercase tracking-wider transition-colors"
          >
            Admin
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="px-6 py-24 max-w-4xl mx-auto text-center"
      >
        <div className="mb-6">
          <span className="px-2 py-1 text-[9px] font-bold uppercase bg-green-500/10 text-green-500 border border-green-500/20 tracking-wider">
            v3.0
          </span>
        </div>
        <h1 className="text-4xl font-bold text-neutral-100 uppercase tracking-widest mb-4">
          PolyEdge
        </h1>
        <p className="text-lg text-green-500 uppercase tracking-wider mb-3">
          AI-Powered Polymarket Edge
        </p>
        <p className="text-sm text-neutral-500 max-w-xl mx-auto leading-relaxed mb-10">
          Automated trading bot for Polymarket and Kalshi prediction markets.
          BTC 5-minute windows, weather temperature markets, and copy trading
          with ensemble forecasts and Kelly criterion sizing.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/dashboard"
            className="px-6 py-2.5 bg-green-500/10 border border-green-500/30 text-green-400 text-xs uppercase tracking-wider hover:bg-green-500/20 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/admin"
            className="px-6 py-2.5 bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs uppercase tracking-wider hover:border-neutral-600 transition-colors"
          >
            Admin Panel
          </Link>
        </div>
      </motion.section>

      {/* Features */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[10px] text-neutral-600 uppercase tracking-[0.3em]">Capabilities</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="border border-neutral-800 bg-neutral-900/30 p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase border ${f.badgeColor}`}>
                  {f.badge}
                </span>
                <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">{f.title}</h3>
              </div>
              <p className="text-[11px] text-neutral-500 leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16 max-w-4xl mx-auto border-t border-neutral-800">
        <div className="text-center mb-12">
          <span className="text-[10px] text-neutral-600 uppercase tracking-[0.3em]">Pipeline</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl font-bold text-neutral-800 mb-2 tabular-nums">{s.step}</div>
              <h4 className="text-xs font-bold text-green-500 uppercase tracking-wider mb-2">{s.title}</h4>
              <p className="text-[11px] text-neutral-500 leading-relaxed">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 px-6 py-3 flex items-center justify-between">
        <span className="text-[10px] text-neutral-700">
          Binance/Coinbase | Open-Meteo | Polymarket + Kalshi
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[10px] text-neutral-600">Online</span>
          </div>
          <span className="text-[10px] text-neutral-700">v3.0.0</span>
        </div>
      </footer>
    </div>
  )
}
