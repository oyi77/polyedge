import { useWebSocket } from '../hooks/useWebSocket';

interface MarketTick {
  market_id: string;
  yes_price: number;
  no_price: number;
  volume: number;
}

export default function LiveMarketView({ url = '/ws/markets' }: { url?: string }) {
  const { data, status } = useWebSocket<MarketTick>(url);
  return (
    <div className="live-market-view" data-status={status}>
      <h3>Live Markets <span className={`status status-${status}`}>{status}</span></h3>
      {data ? (
        <div className="market-tick" style={{ transition: 'background-color 0.4s ease' }}>
          <div><strong>{data.market_id}</strong></div>
          <div>YES: {(data.yes_price * 100).toFixed(1)}% | NO: {(data.no_price * 100).toFixed(1)}%</div>
          <div>Volume: ${data.volume.toLocaleString()}</div>
        </div>
      ) : (
        <div className="live-market-empty">Waiting for market data…</div>
      )}
    </div>
  );
}
