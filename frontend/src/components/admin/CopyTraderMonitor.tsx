import { useQuery } from '@tanstack/react-query'
import { fetchCopyTraderStatus } from '../../api'

export function CopyTraderMonitor() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['copy-trader-status'],
    queryFn: fetchCopyTraderStatus,
    refetchInterval: 30000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Loading copy trader status...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[10px] text-red-500 uppercase tracking-wider">Failed to load copy trader status</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${data.enabled ? 'bg-green-500' : 'bg-neutral-600'}`} />
        <span className={`text-xs font-bold uppercase ${data.enabled ? 'text-green-500' : 'text-neutral-500'}`}>
          {data.enabled ? 'Enabled' : 'Disabled'}
        </span>
        <span className="text-[10px] text-neutral-500 tabular-nums">
          {data.tracked_wallets} wallets tracked
        </span>
      </div>

      {/* Wallet Table */}
      {data.wallet_details.length > 0 ? (
        <div className="border border-neutral-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left text-[9px] text-neutral-500 uppercase tracking-wider px-3 py-2">Wallet</th>
                <th className="text-left text-[9px] text-neutral-500 uppercase tracking-wider px-3 py-2">Pseudonym</th>
                <th className="text-right text-[9px] text-neutral-500 uppercase tracking-wider px-3 py-2">Score</th>
                <th className="text-right text-[9px] text-neutral-500 uppercase tracking-wider px-3 py-2">30d Profit</th>
              </tr>
            </thead>
            <tbody>
              {data.wallet_details.map((w, i) => (
                <tr key={i} className="border-b border-neutral-800/50 hover:bg-neutral-800/20">
                  <td className="px-3 py-2 text-[10px] text-neutral-400 font-mono">{w.address}</td>
                  <td className="px-3 py-2 text-[10px] text-neutral-300">{w.pseudonym}</td>
                  <td className="px-3 py-2 text-[10px] text-neutral-200 tabular-nums text-right">{w.score.toFixed(1)}</td>
                  <td className={`px-3 py-2 text-[10px] tabular-nums text-right ${w.profit_30d >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${w.profit_30d.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-neutral-800 bg-neutral-900/20 p-8 text-center">
          <div className="text-[10px] text-neutral-600 uppercase tracking-wider">No wallets tracked yet</div>
          <div className="text-[10px] text-neutral-700 mt-1">Copy trader will populate this when enabled</div>
        </div>
      )}

      {/* Recent Signals */}
      {data.recent_signals.length > 0 && (
        <div className="border border-neutral-800 bg-neutral-900/20 p-3">
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Recent Copy Signals</div>
          <div className="space-y-1">
            {data.recent_signals.map((sig, i) => (
              <div key={i} className="text-[10px] text-neutral-400 font-mono">
                {JSON.stringify(sig)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
