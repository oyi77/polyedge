import { useState } from 'react'
import { NavBar } from '../components/NavBar'
import { SettingsEditor } from '../components/admin/SettingsEditor'
import { SystemStatus } from '../components/admin/SystemStatus'
import { CopyTraderMonitor } from '../components/admin/CopyTraderMonitor'

const TABS = ['Settings', 'System', 'Copy Trader', 'Telegram'] as const
type Tab = typeof TABS[number]

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
            // Fire and forget test message
            fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/admin/telegram-test`, { method: 'POST' })
              .catch(() => {})
          }}
        >
          Send Test Message
        </button>
      </div>
    </div>
  )
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>('Settings')

  return (
    <div className="h-screen bg-black text-neutral-200 flex flex-col overflow-hidden font-mono">
      <NavBar title="Admin Dashboard" />

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
      </div>
    </div>
  )
}
