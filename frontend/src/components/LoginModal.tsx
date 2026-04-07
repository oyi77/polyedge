import { useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  onSuccess: () => void
  onCancel?: () => void
  login: (password: string) => Promise<void>
}

export function LoginModal({ onSuccess, onCancel, login }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return
    setLoading(true)
    setError('')
    try {
      await login(password)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={e => { if (e.target === e.currentTarget) onCancel?.() }}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="w-80 border border-neutral-700 bg-black p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Admin Access</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Admin password"
            autoFocus
            className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs px-3 py-2 focus:outline-none focus:border-green-500/50 font-mono placeholder-neutral-700"
          />

          {error && (
            <p className="text-[10px] text-red-400 font-mono">{error}</p>
          )}

          <div className="flex gap-2 mt-1">
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="flex-1 px-3 py-1.5 bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] uppercase tracking-wider hover:bg-green-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Login'}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 bg-neutral-900 border border-neutral-700 text-neutral-500 text-[10px] uppercase tracking-wider hover:border-neutral-600 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
