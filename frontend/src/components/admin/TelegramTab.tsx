import { useState } from 'react'
import { adminApi } from '../../api'

export function TelegramTab() {
  const [sending, setSending] = useState(false)

  const handleTest = async () => {
    setSending(true)
    try {
      await adminApi.post('/admin/alerts/test')
    } catch {
      // Error handled silently
    } finally {
      setSending(false)
    }
  }

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
          className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 text-neutral-400 text-[10px] uppercase tracking-wider hover:border-neutral-600 transition-colors disabled:opacity-50"
          onClick={handleTest}
          disabled={sending}
        >
          {sending ? 'Sending...' : 'Send Test Message'}
        </button>
      </div>
    </div>
  )
}
