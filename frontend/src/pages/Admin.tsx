import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { NavBar } from '../components/NavBar'
import { SettingsEditor } from '../components/admin/SettingsEditor'
import { SystemStatus } from '../components/admin/SystemStatus'
import { CopyTraderMonitor } from '../components/admin/CopyTraderMonitor'
import {
  getAdminApiKey,
  setAdminApiKey,
  updateCredentials,
  fetchStrategies,
  updateStrategy,
  runStrategyNow,
  fetchMarketWatches,
  createMarketWatch,
  deleteMarketWatch,
  fetchWalletConfigs,
  createWalletConfig,
  updateWalletConfig,
  deleteWalletConfig,
} from '../api'

const TABS = ['Settings', 'System', 'Copy Trader', 'Telegram', 'Credentials', 'Strategies', 'Market Watch', 'Wallet Config'] as const
type Tab = typeof TABS[number]

function StrategiesTab() {
  const qc = useQueryClient()
  const [runState, setRunState] = useState<Record<string, 'idle' | 'running' | 'done'>>({})

  const { data: strategies = [], isLoading } = useQuery({
    queryKey: ['strategies'],
    queryFn: fetchStrategies,
    refetchInterval: 30_000,
  })

  const handleToggle = async (name: string, enabled: boolean) => {
    await updateStrategy(name, { enabled: !enabled })
    qc.invalidateQueries({ queryKey: ['strategies'] })
  }

  const handleRunNow = async (name: string) => {
    setRunState(s => ({ ...s, [name]: 'running' }))
    try {
      await runStrategyNow(name)
      setRunState(s => ({ ...s, [name]: 'done' }))
      setTimeout(() => setRunState(s => ({ ...s, [name]: 'idle' })), 2000)
    } catch {
      setRunState(s => ({ ...s, [name]: 'idle' }))
    }
  }

  if (isLoading) return <div className="text-[10px] text-neutral-600">Loading strategies...</div>

  return (
    <div className="space-y-2">
      <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-3">
        Strategies — {strategies.length} total
      </div>
      {strategies.map(s => (
        <div key={s.name} className="border border-neutral-800 p-3 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-neutral-200 font-mono">{s.name}</span>
              <span className="text-[9px] text-neutral-600 uppercase tracking-wider">{s.category}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRunNow(s.name)}
                disabled={runState[s.name] === 'running'}
                className="px-2 py-0.5 border border-neutral-700 text-neutral-400 text-[9px] uppercase tracking-wider hover:border-neutral-500 transition-colors disabled:opacity-40"
              >
                {runState[s.name] === 'running' ? 'Running...' : runState[s.name] === 'done' ? 'Done' : 'Run Now'}
              </button>
              <button
                onClick={() => handleToggle(s.name, s.enabled)}
                className={`px-2 py-0.5 border text-[9px] uppercase tracking-wider transition-colors ${
                  s.enabled
                    ? 'border-green-700 text-green-500 hover:border-green-500'
                    : 'border-neutral-700 text-neutral-500 hover:border-neutral-500'
                }`}
              >
                {s.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
          <div className="text-[10px] text-neutral-500">{s.description}</div>
          <div className="text-[9px] text-neutral-600 font-mono">interval: {s.interval_seconds}s</div>
        </div>
      ))}
    </div>
  )
}

function MarketWatchTab() {
  const qc = useQueryClient()
  const [ticker, setTicker] = useState('')
  const [category, setCategory] = useState('')
  const [adding, setAdding] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['market-watches'],
    queryFn: () => fetchMarketWatches(),
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0

  const handleDelete = async (id: number) => {
    await deleteMarketWatch(id)
    qc.invalidateQueries({ queryKey: ['market-watches'] })
  }

  const handleAdd = async () => {
    if (!ticker.trim()) return
    setAdding(true)
    try {
      await createMarketWatch({ ticker: ticker.trim(), category: category.trim() || undefined })
      setTicker('')
      setCategory('')
      qc.invalidateQueries({ queryKey: ['market-watches'] })
    } finally {
      setAdding(false)
    }
  }

  if (isLoading) return <div className="text-[10px] text-neutral-600">Loading market watches...</div>

  return (
    <div className="space-y-4">
      <div className="text-[10px] text-neutral-500 uppercase tracking-wider">
        Market Watch — {total} total
      </div>
      <div className="border border-neutral-800">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="text-left px-3 py-1.5 text-neutral-600 uppercase tracking-wider">Ticker</th>
              <th className="text-left px-3 py-1.5 text-neutral-600 uppercase tracking-wider">Category</th>
              <th className="text-left px-3 py-1.5 text-neutral-600 uppercase tracking-wider">Source</th>
              <th className="text-left px-3 py-1.5 text-neutral-600 uppercase tracking-wider">Enabled</th>
              <th className="px-3 py-1.5"></th>
            </tr>
          </thead>
          <tbody>
            {items.map(row => (
              <tr key={row.id} className="border-b border-neutral-800/50 hover:bg-neutral-900/30">
                <td className="px-3 py-1.5 text-neutral-300">{row.ticker}</td>
                <td className="px-3 py-1.5 text-neutral-500">{row.category || '—'}</td>
                <td className="px-3 py-1.5 text-neutral-500">{row.source || '—'}</td>
                <td className="px-3 py-1.5">
                  <span className={row.enabled ? 'text-green-500' : 'text-neutral-600'}>
                    {row.enabled ? 'yes' : 'no'}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-right">
                  <button
                    onClick={() => handleDelete(row.id)}
                    className="text-red-600 hover:text-red-400 transition-colors text-[11px] leading-none"
                    title="Delete"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-3 text-neutral-700 text-center">No market watches configured</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="border border-neutral-800 p-3">
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Add Market Watch</div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={ticker}
            onChange={e => setTicker(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Ticker"
            className="bg-transparent border border-neutral-800 text-neutral-300 text-[10px] px-2 py-1 font-mono focus:border-neutral-600 focus:outline-none w-48 placeholder:text-neutral-700"
          />
          <input
            type="text"
            value={category}
            onChange={e => setCategory(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Category (optional)"
            className="bg-transparent border border-neutral-800 text-neutral-300 text-[10px] px-2 py-1 font-mono focus:border-neutral-600 focus:outline-none w-48 placeholder:text-neutral-700"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !ticker.trim()}
            className="px-3 py-1 bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] uppercase tracking-wider hover:border-neutral-500 transition-colors disabled:opacity-40"
          >
            {adding ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}

function WalletConfigTab() {
  const qc = useQueryClient()
  const [address, setAddress] = useState('')
  const [pseudonym, setPseudonym] = useState('')
  const [adding, setAdding] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['wallet-configs'],
    queryFn: () => fetchWalletConfigs(),
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0

  const handleToggle = async (id: number, enabled: boolean) => {
    await updateWalletConfig(id, { enabled: !enabled })
    qc.invalidateQueries({ queryKey: ['wallet-configs'] })
  }

  const handleDelete = async (id: number) => {
    await deleteWalletConfig(id)
    qc.invalidateQueries({ queryKey: ['wallet-configs'] })
  }

  const handleTrack = async () => {
    if (!address.trim()) return
    setAdding(true)
    try {
      await createWalletConfig({ address: address.trim(), pseudonym: pseudonym.trim() || undefined })
      setAddress('')
      setPseudonym('')
      qc.invalidateQueries({ queryKey: ['wallet-configs'] })
    } finally {
      setAdding(false)
    }
  }

  const truncate = (addr: string) =>
    addr.length > 16 ? `${addr.slice(0, 8)}…${addr.slice(-6)}` : addr

  if (isLoading) return <div className="text-[10px] text-neutral-600">Loading wallet configs...</div>

  return (
    <div className="space-y-4">
      <div className="text-[10px] text-neutral-500 uppercase tracking-wider">
        Wallet Config — {total} total
      </div>
      <div className="border border-neutral-800">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="text-left px-3 py-1.5 text-neutral-600 uppercase tracking-wider">Address</th>
              <th className="text-left px-3 py-1.5 text-neutral-600 uppercase tracking-wider">Pseudonym</th>
              <th className="text-left px-3 py-1.5 text-neutral-600 uppercase tracking-wider">Source</th>
              <th className="text-left px-3 py-1.5 text-neutral-600 uppercase tracking-wider">Enabled</th>
              <th className="px-3 py-1.5"></th>
            </tr>
          </thead>
          <tbody>
            {items.map(row => (
              <tr key={row.id} className="border-b border-neutral-800/50 hover:bg-neutral-900/30">
                <td className="px-3 py-1.5 text-neutral-300" title={row.address}>{truncate(row.address)}</td>
                <td className="px-3 py-1.5 text-neutral-400">{row.pseudonym || '—'}</td>
                <td className="px-3 py-1.5 text-neutral-500">{row.source || '—'}</td>
                <td className="px-3 py-1.5">
                  <button
                    onClick={() => handleToggle(row.id, row.enabled)}
                    className={`text-[9px] uppercase tracking-wider transition-colors ${
                      row.enabled ? 'text-green-500 hover:text-green-400' : 'text-neutral-600 hover:text-neutral-400'
                    }`}
                  >
                    {row.enabled ? 'yes' : 'no'}
                  </button>
                </td>
                <td className="px-3 py-1.5 text-right">
                  <button
                    onClick={() => handleDelete(row.id)}
                    className="text-red-600 hover:text-red-400 transition-colors text-[11px] leading-none"
                    title="Delete"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-3 text-neutral-700 text-center">No wallets configured</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="border border-neutral-800 p-3">
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Track Wallet</div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTrack()}
            placeholder="0x address"
            className="bg-transparent border border-neutral-800 text-neutral-300 text-[10px] px-2 py-1 font-mono focus:border-neutral-600 focus:outline-none w-64 placeholder:text-neutral-700"
          />
          <input
            type="text"
            value={pseudonym}
            onChange={e => setPseudonym(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTrack()}
            placeholder="Pseudonym (optional)"
            className="bg-transparent border border-neutral-800 text-neutral-300 text-[10px] px-2 py-1 font-mono focus:border-neutral-600 focus:outline-none w-48 placeholder:text-neutral-700"
          />
          <button
            onClick={handleTrack}
            disabled={adding || !address.trim()}
            className="px-3 py-1 bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] uppercase tracking-wider hover:border-neutral-500 transition-colors disabled:opacity-40"
          >
            {adding ? 'Tracking...' : 'Track'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CredentialsTab() {
  const [privateKey, setPrivateKey] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [apiPassphrase, setApiPassphrase] = useState('')
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const payload: Record<string, string> = {}
    if (privateKey.trim()) payload.private_key = privateKey.trim()
    if (apiKey.trim()) payload.api_key = apiKey.trim()
    if (apiSecret.trim()) payload.api_secret = apiSecret.trim()
    if (apiPassphrase.trim()) payload.api_passphrase = apiPassphrase.trim()
    if (!Object.keys(payload).length) return

    setSaving(true)
    setStatus(null)
    try {
      const result = await updateCredentials(payload)
      setStatus({ ok: true, message: `Saved: ${result.updated.join(', ')}` })
      setPrivateKey('')
      setApiKey('')
      setApiSecret('')
      setApiPassphrase('')
    } catch {
      setStatus({ ok: false, message: 'Failed to save credentials' })
    } finally {
      setSaving(false)
    }
  }

  const fields = [
    {
      label: 'Private Key',
      hint: 'Required for testnet + live (0x hex private key)',
      value: privateKey,
      setter: setPrivateKey,
      mode: 'testnet + live',
    },
    {
      label: 'API Key',
      hint: 'Required for live only',
      value: apiKey,
      setter: setApiKey,
      mode: 'live',
    },
    {
      label: 'API Secret',
      hint: 'Required for live only',
      value: apiSecret,
      setter: setApiSecret,
      mode: 'live',
    },
    {
      label: 'API Passphrase',
      hint: 'Required for live only',
      value: apiPassphrase,
      setter: setApiPassphrase,
      mode: 'live',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="border border-neutral-800 bg-neutral-900/20 p-4">
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Polymarket Credentials</div>
        <p className="text-[11px] text-neutral-600 mb-4 leading-relaxed">
          Credentials are persisted to <span className="text-neutral-400 font-mono">.env</span> and hot-reloaded — no restart needed.
          Only fill fields you want to update. Paper mode requires no credentials.
        </p>
        <div className="space-y-3">
          {fields.map(({ label, hint, value, setter, mode }) => (
            <div key={label}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider w-36">{label}</span>
                <span className="text-[9px] text-neutral-600">({mode})</span>
              </div>
              <input
                type="password"
                value={value}
                onChange={e => setter(e.target.value)}
                placeholder={hint}
                className="w-full bg-transparent border border-neutral-800 text-neutral-300 text-[10px] px-2 py-1 font-mono focus:border-neutral-600 focus:outline-none placeholder:text-neutral-700"
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] uppercase tracking-wider hover:border-neutral-500 transition-colors disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save Credentials'}
          </button>
          {status && (
            <span className={`text-[10px] font-mono ${status.ok ? 'text-green-500' : 'text-red-500'}`}>
              {status.message}
            </span>
          )}
        </div>
      </div>
      <div className="border border-neutral-800 bg-neutral-900/20 p-4">
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Mode Requirements</div>
        <div className="space-y-1 text-[10px] font-mono">
          <div className="flex gap-3"><span className="text-green-500">paper</span><span className="text-neutral-600">— no credentials needed, simulated orders only</span></div>
          <div className="flex gap-3"><span className="text-yellow-500">testnet</span><span className="text-neutral-600">— Private Key only, Amoy testnet (chain 80002), staging CLOB</span></div>
          <div className="flex gap-3"><span className="text-red-400">live</span><span className="text-neutral-600">— Private Key + API Key + Secret + Passphrase, mainnet</span></div>
        </div>
      </div>
    </div>
  )
}

function TelegramTab() {
  return (
    <div className="space-y-4">
      <div className="border border-neutral-800 bg-neutral-900/20 p-4">
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-3">Telegram Bot</div>
        <p className="text-[11px] text-neutral-400 leading-relaxed">
          Configure Telegram bot token and admin chat IDs in the Settings tab under the Telegram section.
          The bot sends trade notifications, signal alerts, and system status updates to configured admin chats.
        </p>
      </div>
      <div className="border border-neutral-800 bg-neutral-900/20 p-4">
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-3">Test Message</div>
        <p className="text-[11px] text-neutral-600 mb-3">
          Send a test message to verify bot configuration. Requires TELEGRAM_BOT_TOKEN and TELEGRAM_ADMIN_CHAT_IDS to be set.
        </p>
        <button
          className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 text-neutral-400 text-[10px] uppercase tracking-wider hover:border-neutral-600 transition-colors"
          onClick={() => {
            fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/telegram-test`, { method: 'POST' })
              .catch(() => {})
          }}
        >
          Send Test Message
        </button>
      </div>
    </div>
  )
}

function ApiKeyBar() {
  const [key, setKey] = useState(getAdminApiKey())
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setAdminApiKey(key)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="shrink-0 bg-neutral-950 border-b border-neutral-800 px-4 py-1.5 flex items-center gap-3">
      <span className="text-[9px] text-neutral-600 uppercase tracking-wider shrink-0">Admin Key</span>
      <input
        type="password"
        value={key}
        onChange={e => setKey(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSave()}
        placeholder="Bearer token (leave blank if not required)"
        className="flex-1 bg-transparent border border-neutral-800 text-neutral-400 text-[10px] px-2 py-0.5 font-mono focus:border-neutral-600 focus:outline-none"
      />
      <button
        onClick={handleSave}
        className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 text-neutral-400 text-[9px] uppercase tracking-wider hover:border-neutral-600 transition-colors"
      >
        {saved ? 'Saved' : 'Set'}
      </button>
    </div>
  )
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>('Settings')

  return (
    <div className="h-screen bg-black text-neutral-200 flex flex-col overflow-hidden font-mono">
      <NavBar title="Admin Dashboard" />
      <ApiKeyBar />

      {/* Tab Bar */}
      <div className="shrink-0 border-b border-neutral-800 px-4 flex items-center gap-0">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-[10px] uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === tab
                ? 'text-green-500 border-green-500'
                : 'text-neutral-500 border-transparent hover:text-neutral-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 max-w-4xl">
        {activeTab === 'Settings' && <SettingsEditor />}
        {activeTab === 'System' && <SystemStatus />}
        {activeTab === 'Copy Trader' && <CopyTraderMonitor />}
        {activeTab === 'Telegram' && <TelegramTab />}
        {activeTab === 'Credentials' && <CredentialsTab />}
        {activeTab === 'Strategies' && <StrategiesTab />}
        {activeTab === 'Market Watch' && <MarketWatchTab />}
        {activeTab === 'Wallet Config' && <WalletConfigTab />}
      </div>
    </div>
  )
}
