---
sidebar_position: 9
---

# Realtime Scanner

The Realtime Scanner strategy is a momentum-based trading approach that identifies rapid price movements on prediction markets using real-time price feeds.

:::info
In prediction markets, "price velocity" can be a leading indicator of momentum shifts before slower indicators like RSI or SMA can react.
:::

## How It Works

The strategy monitors price changes in real-time using a WebSocket connection to the Polymarket CLOB. It calculates price "velocity" across multiple time windows (5s, 15s, and 30s) and generates signals when the velocity exceeds a configured threshold.

The technical mechanism includes:
- **Price History Tracking**: Maintains a 100-point sliding window of mid-prices for each tracked token ID.
- **Velocity Calculation**:
  - `velocity = (current_price - price_n_seconds_ago) / n_seconds`
  - Calculates velocity over fast (5s), medium (15s), and slow (30s) windows.
- **Signal Filtering**: Only considers high-liquidity ($1,000+) and high-volume ($5,000+) markets to avoid trading on noise.
- **WebSocket Integration**: Automatically subscribes and unsubscribes from tokens as they enter or exit the tracking pool.

## Configuration

Relevant environment variables and settings for the Realtime Scanner strategy:

| Variable | Description | Default |
|----------|-------------|---------|
| `velocity_threshold_up` | The required velocity (price change per second) for an UP signal. | 0.15 (15% in 30s) |
| `velocity_threshold_down` | The required velocity (price change per second) for a DOWN signal. | -0.15 (-15% in 30s) |
| `velocity_window_fast` | Time window (in seconds) for fast velocity calculation. | 5 |
| `velocity_window_med` | Time window (in seconds) for medium velocity calculation. | 15 |
| `velocity_window_slow` | Time window (in seconds) for slow velocity calculation. | 30 |
| `min_signal_interval` | Minimum seconds between signals for the same token ID. | 60 |
| `min_history_points` | Minimum number of price points required to calculate velocity. | 10 |
| `min_liquidity` | Minimum liquidity (in USDC) of the target market. | 1,000.0 |
| `min_volume` | Minimum daily volume (in USDC) of the target market. | 5,000.0 |

## Signal Generation

Signals are produced when:
1. Active, high-liquidity markets are identified.
2. At least 10 price history points have been collected for the token.
3. The slow velocity (30s window) exceeds the `velocity_threshold_up` or `velocity_threshold_down` threshold.
4. The signal cooldown (60s) for the token ID has passed.

The strategy computes a "BUY UP" or "BUY DOWN" direction based on the detected velocity.

## Risk Controls

- **Liquidity/Volume Filter**: Only markets with sufficient liquidity ($1,000+) and volume ($5,000+) are targeted to minimize slippage and noise.
- **Signal Interval**: Enforces a 60-second minimum gap between signals for the same token ID.
- **Velocity Thresholds**: Requires significant price movement (15% in 30 seconds) before firing, reducing false positives.
- **Execution Mode**: Operates in "paper" mode by default to validate the momentum signal before risking live capital.

## Example

1. **Market**: "Will the debt ceiling be raised by Tuesday?"
2. **Analysis**: Mid-price is $0.50. Market has $100k daily volume and $10k liquidity.
3. **Price Update**: Over the last 30 seconds, the price has rapidly increased from $0.50 to $0.65.
4. **Calculation**:
  - **Velocity**: (0.65 - 0.50) / 30 = 0.005 per second.
  - **30s Velocity**: 0.005 * 30 = 0.15.
5. **Execution**: The 0.15 velocity meets the `velocity_threshold_up` threshold (0.15). A $100 "BUY UP" order is placed.
6. **Result**: The bot captures the rapid momentum shift before slower indicators can confirm the trend.
