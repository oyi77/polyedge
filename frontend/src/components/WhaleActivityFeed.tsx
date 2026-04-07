import { useEffect, useState } from 'react';

interface WhaleTx {
  id: number;
  tx_hash: string;
  wallet: string;
  market_id: string | null;
  size_usd: number;
  observed_at: string | null;
}

export default function WhaleActivityFeed() {
  const [items, setItems] = useState<WhaleTx[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/whales/transactions?limit=20')
      .then(r => r.json())
      .then(d => { if (!cancelled) setItems(Array.isArray(d) ? d : []); })
      .catch(() => { if (!cancelled) setItems([]); });
    return () => { cancelled = true; };
  }, []);
  return (
    <div className="whale-feed">
      <h3>Whale Activity</h3>
      {items.length === 0 ? (
        <div>No recent whale trades.</div>
      ) : (
        <ul>
          {items.map(it => (
            <li key={it.id}>
              <code>{it.wallet.slice(0, 10)}…</code> ${it.size_usd.toLocaleString()}
              {it.observed_at && <span> · {new Date(it.observed_at).toLocaleTimeString()}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
