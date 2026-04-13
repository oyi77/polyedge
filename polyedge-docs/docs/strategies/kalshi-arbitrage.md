---
sidebar_position: 6
---

# Kalshi Arbitrage

The Kalshi Arbitrage strategy focuses on identifying and exploiting price differences between prediction markets on the Polymarket and Kalshi platforms.

:::info
This strategy is currently in the **SCAFFOLD** stage and requires a `KALSHI_API_KEY` to activate. It is disabled by default until credentials are configured.
:::

## How It Works

The strategy scans for "crossed-book" opportunities between the two platforms. This occurs when the price for a "YES" share on Polymarket and the price for a "YES" share on Kalshi for the same event add up to less than $1.00.

The technical mechanism includes:
- **Platform Scanning**: Scans for identical markets across both platforms (e.g., matching tickers or event slugs).
- **Edge Calculation**:
  - **Gross Edge**: Calculated as `1.0 - (Polymarket YES Price + Kalshi YES Price)`.
  - **Net Edge**: Calculated as `Gross Edge - (Polymarket Fees + Kalshi Fees)`.
- **Fee Accounting**: Includes a 2% maker fee on Polymarket and a 1% taker fee on Kalshi.
- **Crossed-Book Execution**: Fires a trade when the net edge after fees is positive and exceeds a minimum threshold.

## Configuration

Relevant environment variables and settings for the Kalshi Arbitrage strategy:

| Variable | Description | Default |
|----------|-------------|---------|
| `min_edge` | The minimum required net edge (after fees) to fire a trade. | 0.02 (2%) |
| `allow_live_execution` | Whether to execute live arbitrage trades. | False |
| `interval_seconds` | How often the strategy scans for new arbitrage opportunities. | 30 |

## Signal Generation

Signals are produced when:
1. Two markets on Polymarket and Kalshi are identified as being the same event.
2. The YES prices on both platforms have been fetched successfully.
3. The resulting net edge (after accounting for fees) is at least 2%.
4. No other arbitrage trades are currently in progress for the same market.

The strategy computes specific buy/sell actions for both platforms simultaneously.

## Risk Controls

- **Net Edge Threshold**: Requires at least 2% net edge after all fees to fire a trade.
- **Seeded Disabled**: The strategy is initialized as `enabled=False` until appropriate API credentials are provided.
- **Market Selection**: Only targets markets that have a direct Kalshi equivalent.

## Example

1. **Market**: "Will the Fed raise interest rates at the next meeting?"
2. **Analysis**:
  - **Polymarket Price**: YES is trading at $0.45.
  - **Kalshi Price**: YES is trading at $0.50.
3. **Calculation**:
  - **Gross Edge**: 1.0 - 0.45 - 0.50 = 0.05 ($0.05 per share).
  - **Total Fees**: 2% (Poly) + 1% (Kalshi) = 3% ($0.03 per share).
  - **Net Edge**: 5% - 3% = 2% ($0.02 per share).
4. **Execution**: The 2% net edge meets the minimum threshold. The bot places a buy order on both platforms to capture the guaranteed 2% profit (plus any potential for price convergence).
