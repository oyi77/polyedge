import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSystemStatus, startBot, stopBot } from '../../api'

const MODE_BADGES: Record<string, { label: string; className: string }> = {
  paper: { label: 'Paper', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  testnet: { label: 'Testnet', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  live: { label: 'Live', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

export function SystemStatus() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-system'],
    queryFn: fetchSystemStatus,
    refetchInterval: 10000,
  })

  const startMutation = useMutation({
    mutationFn: startBot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-system'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const stopMutation = useMutation({
    mutationFn: stopBot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-system'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Loading system status...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[10px] text-red-500 uppercase tracking-wider">Failed to load system status</div>
      </div>
    )
  }

  const modeBadge = MODE_BADGES[data.trading_mode] || MODE_BADGES.paper

  return (
    <div className="space-y-4">
      {/* Mode + Bot Status */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-neutral-800 bg-neutral-900/20 p-4">
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Trading Mode</div>
          <span className={`px-2 py-1 text-xs font-bold uppercase border ${modeBadge.className}`}>
            {modeBadge.label}
          </span>
        </div>
        <div className="border border-neutral-800 bg-neutral-900/20 p-4">
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Bot Status</div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${data.bot_running ? 'bg-green-500' : 'bg-neutral-600'}`} />
            <span className={`text-xs font-bold uppercase ${data.bot_running ? 'text-green-500' : 'text-neutral-500'}`}>
              {data.bot_running ? 'Running' : 'Stopped'}
            </span>
            <button
              onClick={() => data.bot_running ? stopMutation.mutate() : startMutation.mutate()}
              disabled={startMutation.isPending || stopMutation.isPending}
              className={`ml-auto px-2.5 py-1 text-[10px] uppercase tracking-wider border transition-colors disabled:opacity-50 ${
                data.bot_running
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                  : 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
              }`}
            >
              {data.bot_running ? 'Stop' : 'Start'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border border-neutral-800 bg-neutral-900/20 p-3">
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Pending Trades</div>
          <div className="text-lg font-bold text-neutral-200 tabular-nums">{data.pending_trades}</div>
        </div>
        <div className="border border-neutral-800 bg-neutral-900/20 p-3">
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Total Trades</div>
          <div className="text-lg font-bold text-neutral-200 tabular-nums">{data.db_trade_count}</div>
        </div>
        <div className="border border-neutral-800 bg-neutral-900/20 p-3">
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Total Signals</div>
          <div className="text-lg font-bold text-neutral-200 tabular-nums">{data.db_signal_count}</div>
        </div>
      </div>

      {/* Uptime */}
      <div className="border border-neutral-800 bg-neutral-900/20 p-3">
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Uptime</div>
        <div className="text-xs text-neutral-300 font-mono tabular-nums">
          {Math.floor(data.uptime_seconds / 3600)}h {Math.floor((data.uptime_seconds % 3600) / 60)}m {data.uptime_seconds % 60}s
        </div>
      </div>

      {/* Feature Flags */}
      <div className="border border-neutral-800 bg-neutral-900/20 p-4">
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-3">Features</div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Telegram', enabled: data.telegram_configured },
            { label: 'Kalshi', enabled: data.kalshi_enabled },
            { label: 'Weather', enabled: data.weather_enabled },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-2">
              <span className={`text-xs ${f.enabled ? 'text-green-500' : 'text-neutral-600'}`}>
                {f.enabled ? '[+]' : '[-]'}
              </span>
              <span className={`text-[10px] uppercase tracking-wider ${f.enabled ? 'text-neutral-300' : 'text-neutral-600'}`}>
                {f.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
