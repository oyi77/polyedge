import { Link, useLocation } from 'react-router-dom'

export function NavBar({ title }: { title: string }) {
  const location = useLocation()

  return (
    <nav className="shrink-0 border-b border-neutral-800 px-4 py-2 flex items-center justify-between bg-black">
      <Link
        to="/"
        className="text-[10px] text-neutral-500 hover:text-green-500 uppercase tracking-wider transition-colors"
      >
        PolyEdge
      </Link>
      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">{title}</span>
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className={`text-[10px] uppercase tracking-wider transition-colors ${
            location.pathname === '/dashboard' ? 'text-green-500' : 'text-neutral-500 hover:text-green-500'
          }`}
        >
          Dashboard
        </Link>
        <Link
          to="/admin"
          className={`text-[10px] uppercase tracking-wider transition-colors ${
            location.pathname === '/admin' ? 'text-green-500' : 'text-neutral-500 hover:text-green-500'
          }`}
        >
          Admin
        </Link>
        <Link
          to="/whale-tracker"
          className={`text-[10px] uppercase tracking-wider transition-colors ${
            location.pathname === '/whale-tracker' ? 'text-green-500' : 'text-neutral-500 hover:text-green-500'
          }`}
        >
          Whale Tracker
        </Link>
        <Link
          to="/settlements"
          className={`text-[10px] uppercase tracking-wider transition-colors ${
            location.pathname === '/settlements' ? 'text-green-500' : 'text-neutral-500 hover:text-green-500'
          }`}
        >
          Settlements
        </Link>
        <Link
          to="/market-intel"
          className={`text-[10px] uppercase tracking-wider transition-colors ${
            location.pathname === '/market-intel' ? 'text-green-500' : 'text-neutral-500 hover:text-green-500'
          }`}
        >
          Market Intel
        </Link>
        <Link
          to="/decisions"
          className={`text-[10px] uppercase tracking-wider transition-colors ${
            location.pathname === '/decisions' ? 'text-green-500' : 'text-neutral-500 hover:text-green-500'
          }`}
        >
          Decisions
        </Link>
      </div>
    </nav>
  )
}
