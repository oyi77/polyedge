import LiveMarketView from '../components/LiveMarketView';
import OpportunityScanner from '../components/OpportunityScanner';
import WhaleActivityFeed from '../components/WhaleActivityFeed';

export default function TradingTerminal() {
  return (
    <div className="trading-terminal" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
      <h1 style={{ gridColumn: '1 / -1' }}>Trading Terminal</h1>
      <LiveMarketView />
      <OpportunityScanner />
      <div style={{ gridColumn: '1 / -1' }}>
        <WhaleActivityFeed />
      </div>
    </div>
  );
}
