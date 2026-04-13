---
sidebar_position: 2
---

# BTC Oracle

The BTC Oracle strategy identifies and exploits structural market inefficiencies in short-duration Bitcoin prediction markets on Polymarket. It focuses on the latency between real-time exchange prices and the slower settlement price of oracle-driven markets.

:::info
This strategy replaces the negative-EV [BTC Momentum](./btc-momentum.md) strategy for production Bitcoin trading. It targets a fundamental market gap rather than technical indicators alone.
:::

## How It Works

This strategy monitors the price of Bitcoin using a high-frequency multi-exchange feed (Coinbase, Kraken, Binance) and compares it with the current mid-price of short-duration binary markets on Polymarket that use Chainlink or UMA oracles for settlement.

The technical mechanism includes:
- **Price Microstructure**: Computes a real-time BTC price by aggregating data from the major exchanges.
- **Oracle Latency**: It specifically looks for a 2-5 second window where the oracle settlement price is predictable but not yet reflected in the market's mid-price.
- **Direction Inference**: Automatically parses the market question (e.g., "Will BTC exceed $95,000?") to determine the "YES" or "NO" direction implied by the current BTC price.

## Configuration

Relevant environment variables and settings for the BTC Oracle strategy:

| Variable | Description | Default |
|----------|-------------|---------|
| `min_edge` | The minimum required difference between the oracle-implied price and market mid-price. | 0.05 (5%) |
| `max_minutes_to_resolution` | The maximum time until market resolution to consider a trade. | 60 |
| `interval_seconds` | How often the strategy scans for new BTC markets. | 30 |
| `max_position_usd` | The maximum dollar amount to allocate per position. | 50 |

## Signal Generation

Signals are produced when:
1. The current Bitcoin price from the microstructure feed diverges from the market's mid-price by at least the `min_edge` threshold.
2. The market's resolution is imminent (within `max_minutes_to_resolution`).
3. The model identifies a clear "YES" or "NO" direction based on the market's threshold.

The strategy computes a "YES" or "NO" probability (typically 1.0 or 0.0) based on the oracle's likely settlement price and compares it to the market's mid-price.

## Risk Controls

- **Resolution Window**: Only trades markets resolving within 60 minutes to minimize exposure to unexpected price volatility.
- **Minimum Edge**: Requires at least a 5% edge to account for transaction costs and slippage.
- **Position Cap**: Maximum $50 per trade.

## Example

1. **Market**: "Will BTC be above $95,000 at 4:00 PM?"
2. **Analysis**: It is 3:58 PM. The current BTC price from the microstructure feed is $95,200.
3. **Oracle Prediction**: The oracle is highly likely to resolve the market as "YES" at the current price.
4. **Market Check**: Polymarket YES shares are trading at $0.90 (90% probability).
5. **Execution**: The oracle-implied 100% probability minus the market's 90% probability gives a 10% edge. Since this exceeds the 5% threshold, a "BUY YES" signal is generated.
