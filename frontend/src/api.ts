import axios from 'axios'
import type { DashboardData, Signal, Trade, BotStats, BtcPrice, BtcWindow, WeatherForecast, WeatherSignal } from './types'

// Empty string = relative URL (uses vite proxy in preview, same-origin in prod)
// Set VITE_API_URL to override (e.g. for local dev pointing at remote API)
const API_BASE = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 15000,
})

// Admin API instance — injects Authorization header from localStorage
const adminApi = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 15000,
})

adminApi.interceptors.request.use(config => {
  const key = localStorage.getItem('adminApiKey')
  if (key) {
    config.headers = config.headers ?? {}
    config.headers['Authorization'] = `Bearer ${key}`
  }
  return config
})

export function getAdminApiKey(): string {
  return localStorage.getItem('adminApiKey') ?? ''
}

export function setAdminApiKey(key: string) {
  if (key) localStorage.setItem('adminApiKey', key)
  else localStorage.removeItem('adminApiKey')
}

export async function fetchDashboard(): Promise<DashboardData> {
  const { data } = await api.get<DashboardData>('/dashboard')
  return data
}

export async function fetchSignals(): Promise<Signal[]> {
  const { data } = await api.get<Signal[]>('/signals')
  return data
}

export async function fetchBtcPrice(): Promise<BtcPrice | null> {
  const { data } = await api.get<BtcPrice | null>('/btc/price')
  return data
}

export async function fetchBtcWindows(): Promise<BtcWindow[]> {
  const { data } = await api.get<BtcWindow[]>('/btc/windows')
  return data
}

export async function fetchTrades(): Promise<Trade[]> {
  const { data } = await api.get<Trade[]>('/trades')
  return data
}

export async function fetchStats(): Promise<BotStats> {
  const { data } = await api.get<BotStats>('/stats')
  return data
}

export async function runScan(): Promise<{ total_signals: number; actionable_signals: number }> {
  const { data } = await api.post('/run-scan')
  return data
}

export async function simulateTrade(ticker: string): Promise<{ trade_id: number; size: number }> {
  const { data } = await api.post('/simulate-trade', null, {
    params: { signal_ticker: ticker }
  })
  return data
}

export async function startBot(): Promise<{ status: string; is_running: boolean }> {
  const { data } = await api.post('/bot/start')
  return data
}

export async function stopBot(): Promise<{ status: string; is_running: boolean }> {
  const { data } = await api.post('/bot/stop')
  return data
}

export async function settleTradesApi(): Promise<{ settled_count: number }> {
  const { data } = await api.post('/settle-trades')
  return data
}

export async function resetBot(): Promise<{ status: string; trades_deleted: number; new_bankroll: number }> {
  const { data } = await api.post('/bot/reset')
  return data
}

export async function fetchWeatherForecasts(): Promise<WeatherForecast[]> {
  const { data } = await api.get<WeatherForecast[]>('/weather/forecasts')
  return data
}

export async function fetchWeatherSignals(): Promise<WeatherSignal[]> {
  const { data } = await api.get<WeatherSignal[]>('/weather/signals')
  return data
}

// Admin API (uses adminApi which injects Authorization header)
export async function fetchAdminSettings(): Promise<Record<string, Record<string, unknown>>> {
  const { data } = await adminApi.get('/admin/settings')
  return data
}

export async function updateAdminSettings(updates: Record<string, unknown>): Promise<{ status: string; message: string }> {
  const { data } = await adminApi.post('/admin/settings', { updates })
  return data
}

export async function switchTradingMode(mode: 'paper' | 'testnet' | 'live'): Promise<{ status: string; mode: string }> {
  const { data } = await adminApi.post('/admin/mode', { mode })
  return data
}

export async function updateCredentials(creds: {
  private_key?: string
  api_key?: string
  api_secret?: string
  api_passphrase?: string
}): Promise<{
  status: string
  updated: string[]
  creds_paper: boolean
  creds_testnet: boolean
  creds_live: boolean
  missing_for_testnet: string[]
  missing_for_live: string[]
}> {
  const { data } = await adminApi.post('/admin/credentials', creds)
  return data
}

export async function fetchSystemStatus(): Promise<{
  trading_mode: string
  bot_running: boolean
  uptime_seconds: number
  pending_trades: number
  telegram_configured: boolean
  kalshi_enabled: boolean
  weather_enabled: boolean
  db_trade_count: number
  db_signal_count: number
  creds_paper: boolean
  creds_testnet: boolean
  creds_live: boolean
  missing_for_testnet: string[]
  missing_for_live: string[]
}> {
  const { data } = await adminApi.get('/admin/system')
  return data
}

export async function fetchCopyTraderStatus(): Promise<{
  enabled: boolean
  tracked_wallets: number
  wallet_details: Array<{ address: string; pseudonym: string; score: number; profit_30d: number }>
  recent_signals: Array<Record<string, unknown>>
  status: string
  errors: Array<{ source: string; message: string }>
}> {
  const { data } = await adminApi.get('/copy-trader/status')
  return data
}

export interface CopyTraderPosition {
  wallet: string
  condition_id: string
  side: string
  size: number
  opened_at: string | null
}

export async function fetchCopyTraderPositions(): Promise<CopyTraderPosition[]> {
  const { data } = await adminApi.get<CopyTraderPosition[]>('/copy-trader/positions')
  return data
}

export interface SettlementEvent {
  id: number
  trade_id: number
  market_ticker: string
  resolved_outcome: string | null
  pnl: number | null
  settled_at: string | null
  source: string
}

export async function fetchSettlements(limit = 100, offset = 0): Promise<SettlementEvent[]> {
  const { data } = await api.get<SettlementEvent[]>('/settlements', { params: { limit, offset } })
  return data
}

// ── Leaderboard / Whale Tracker ──────────────────────────────────────────────

export interface ScoredTrader {
  wallet: string
  pseudonym: string
  profit_30d: number
  win_rate: number
  total_trades: number
  unique_markets: number
  estimated_bankroll: number
  score: number
  market_diversity: number
}

export async function fetchCopyLeaderboard(): Promise<ScoredTrader[]> {
  const { data } = await adminApi.get<ScoredTrader[]>('/copy/leaderboard')
  return data
}

// ── Wallet Config ─────────────────────────────────────────────────────────────

export interface WalletConfigRow {
  id: number
  address: string
  pseudonym: string
  source: string
  tags: string[]
  enabled: boolean
  added_at: string | null
}

export async function fetchWalletConfigs(params?: Record<string, string | number | boolean>): Promise<{ items: WalletConfigRow[]; total: number }> {
  const { data } = await adminApi.get('/wallets/config', { params })
  return data
}

export async function createWalletConfig(body: { address: string; pseudonym?: string; source?: string; tags?: string[]; enabled?: boolean }): Promise<WalletConfigRow> {
  const { data } = await adminApi.post('/wallets/config', body)
  return data
}

export async function updateWalletConfig(id: number, body: Partial<{ pseudonym: string; tags: string[]; enabled: boolean; notes: string }>): Promise<WalletConfigRow> {
  const { data } = await adminApi.put(`/wallets/config/${id}`, body)
  return data
}

export async function deleteWalletConfig(id: number): Promise<void> {
  await adminApi.delete(`/wallets/config/${id}`)
}

// ── Strategies ────────────────────────────────────────────────────────────────

export interface StrategyConfig {
  name: string
  description: string
  category: string
  enabled: boolean
  interval_seconds: number
  params: Record<string, unknown>
  default_params: Record<string, unknown>
  updated_at: string | null
}

export async function fetchStrategies(): Promise<StrategyConfig[]> {
  const { data } = await adminApi.get('/strategies')
  return data
}

export async function updateStrategy(name: string, body: { enabled?: boolean; interval_seconds?: number; params?: Record<string, unknown> }): Promise<StrategyConfig> {
  const { data } = await adminApi.put(`/strategies/${name}`, body)
  return data
}

export async function runStrategyNow(name: string): Promise<{ status: string }> {
  const { data } = await adminApi.post(`/strategies/${name}/run-now`)
  return data
}

// ── Market Watch ──────────────────────────────────────────────────────────────

export interface MarketWatchRow {
  id: number
  ticker: string
  category: string
  source: string
  enabled: boolean
  created_at: string | null
}

export async function fetchMarketWatches(params?: Record<string, string | number | boolean>): Promise<{ items: MarketWatchRow[]; total: number }> {
  const { data } = await adminApi.get('/markets/watch', { params })
  return data
}

export async function createMarketWatch(body: { ticker: string; category?: string; source?: string; enabled?: boolean }): Promise<MarketWatchRow> {
  const { data } = await adminApi.post('/markets/watch', body)
  return data
}

export async function deleteMarketWatch(id: number): Promise<void> {
  await adminApi.delete(`/markets/watch/${id}`)
}

// ── Decision Log ──────────────────────────────────────────────────────────────

export interface DecisionLogRow {
  id: number
  strategy: string
  market_ticker: string
  decision: string
  confidence: number | null
  reason: string | null
  outcome: string | null
  created_at: string | null
}

export interface DecisionLogDetail extends DecisionLogRow {
  signal_data: Record<string, unknown> | null
}

export async function fetchDecisions(params?: Record<string, string | number>): Promise<{ items: DecisionLogRow[]; total: number }> {
  const { data } = await api.get('/decisions', { params })
  return data
}

export async function fetchDecision(id: number): Promise<DecisionLogDetail> {
  const { data } = await api.get(`/decisions/${id}`)
  return data
}

export function decisionsExportUrl(params?: Record<string, string>): string {
  const API_BASE = import.meta.env.VITE_API_URL || ''
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return `${API_BASE}/api/decisions/export${qs}`
}

// ── Health ────────────────────────────────────────────────────────────────────

export interface StrategyHealth {
  name: string
  last_heartbeat: string | null
  lag_seconds: number | null
  healthy: boolean
}

export async function fetchHealth(): Promise<{ strategies: StrategyHealth[]; bot_running: boolean }> {
  const { data } = await api.get('/health')
  return data
}
