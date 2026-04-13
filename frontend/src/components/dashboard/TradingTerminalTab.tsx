import LiveMarketView from '../LiveMarketView';
import OpportunityScanner from '../OpportunityScanner';
import WhaleActivityFeed from '../WhaleActivityFeed';

export function TradingTerminalTab() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4">
      <span className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-4">Trading Terminal</span>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LiveMarketView />
        <OpportunityScanner />
        <div className="lg:col-span-2">
          <WhaleActivityFeed />
        </div>
      </div>
    </div>
  );
}
