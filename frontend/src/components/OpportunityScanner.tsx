import { useEffect, useState } from 'react';
import { api } from '../api';

interface ArbOpportunity {
  market_id: string;
  kind: string;
  net_profit: number;
  yes_price?: number;
  no_price?: number;
}

export default function OpportunityScanner() {
  const [items, setItems] = useState<ArbOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get<{ opportunities: ArbOpportunity[] }>('/arbitrage/opportunities')
      .then(r => { if (!cancelled) setItems(r.data.opportunities || []); })
      .catch(() => { if (!cancelled) setItems([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="opp-scanner">Loading opportunities…</div>;
  if (items.length === 0) return <div className="opp-scanner">No arbitrage opportunities right now.</div>;
  return (
    <div className="opp-scanner">
      <h3>Arbitrage Opportunities</h3>
      <ul>
        {items.map((op, i) => (
          <li key={i}>
            <strong>{op.market_id}</strong> [{op.kind}] — net {(op.net_profit * 100).toFixed(2)}%
          </li>
        ))}
      </ul>
    </div>
  );
}
