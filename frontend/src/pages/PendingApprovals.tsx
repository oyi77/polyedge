import { useEffect, useState } from 'react'
import {
  fetchPendingApprovals,
  approvePendingTrade,
  rejectPendingTrade,
  type PendingApproval,
} from '../api'

export default function PendingApprovals() {
  const [items, setItems] = useState<PendingApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchPendingApprovals()
      setItems(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleApprove = async (id: number) => {
    setBusyId(id)
    try {
      await approvePendingTrade(id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = async (id: number) => {
    setBusyId(id)
    try {
      await rejectPendingTrade(id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="page pending-approvals" style={{ padding: '1.5rem' }}>
      <h1>Pending Auto-Trader Approvals</h1>
      <p style={{ opacity: 0.7 }}>
        Trades below the auto-approve confidence threshold are queued here for manual review.
      </p>
      {error && (
        <div className="error" style={{ color: '#ff6b6b', margin: '0.5rem 0' }}>
          Error: {error}
        </div>
      )}
      {loading ? (
        <div>Loading…</div>
      ) : items.length === 0 ? (
        <div>No pending approvals.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #333' }}>
              <th>Market</th>
              <th>Side</th>
              <th>Size</th>
              <th>Confidence</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} style={{ borderBottom: '1px solid #222' }}>
                <td>
                  <code>{it.market_id}</code>
                </td>
                <td>{it.direction}</td>
                <td>${it.size.toFixed(2)}</td>
                <td>{(it.confidence * 100).toFixed(1)}%</td>
                <td>{it.created_at ? new Date(it.created_at).toLocaleString() : '-'}</td>
                <td>
                  <button
                    disabled={busyId === it.id}
                    onClick={() => handleApprove(it.id)}
                    style={{ marginRight: '0.5rem' }}
                  >
                    Approve
                  </button>
                  <button disabled={busyId === it.id} onClick={() => handleReject(it.id)}>
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button onClick={load} style={{ marginTop: '1rem' }}>
        Refresh
      </button>
    </div>
  )
}
