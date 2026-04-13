---
sidebar_position: 7
---

# Bond Scanner

The Bond Scanner strategy is a value-based trading approach for fixed-income prediction markets. It identifies and targets high-probability outcomes near their resolution dates to capture low-risk returns.

:::info
In prediction markets, "bonds" refer to positions with high certainty (e.g., YES shares trading at $0.90+) that are expected to settle soon.
:::

## How It Works

The strategy specifically targets "bond-relevant" markets — those related to Treasury yields, interest rates, the Federal Reserve, and debt ceilings. It aims to buy shares in outcomes that are already highly likely to happen, profiting from the final 3-12% convergence to $1.00 as the resolution date approaches.

The technical mechanism includes:
- **Market Filtering**:
  - **Keywords**: Filters for keywords like "bond", "treasury", "interest rate", "fed", "yield", "debt ceiling", and "t-bill".
  - **Volume**: Only considers markets with a minimum volume of $1,000.
  - **Resolution Date**: Targets markets resolving between 0.5 and 14 days from the current date.
- **Price Analysis**:
  - **Min/Max Prices**: Targets outcomes trading between $0.88 and $0.97.
  - **Outcome Filtering**: Specifically checks the outcome prices (YES/NO/UP/DOWN) for the target market.
- **Conservative Edge Model**:
  - Assumes a "proximity boost" of 0.5-1.0% for high-probability outcomes near resolution, based on the natural bias of liquidity providers wanting to exit positions early.

## Configuration

Relevant environment variables and settings for the Bond Scanner strategy:

| Variable | Description | Default |
|----------|-------------|---------|
| `min_price` | Minimum price (in dollars) of a high-probability outcome to target. | 0.88 ($0.88) |
| `max_price` | Maximum price (in dollars) of a high-probability outcome to target. | 0.97 ($0.97) |
| `min_volume` | Minimum daily volume of the target market. | 1,000.0 |
| `max_days_to_resolution` | Maximum number of days until the market resolves. | 14 |
| `min_days_to_resolution` | Minimum number of days until the market resolves. | 0.5 |
| `max_concurrent_bonds` | Maximum number of bond-related trades allowed simultaneously. | 8 |
| `max_position_size` | Maximum dollar amount to allocate per bond trade. | 8.0 |

## Signal Generation

Signals are produced when:
1. Active, high-volume bond markets are identified.
2. The market's resolution date is within the target window (0.5 to 14 days).
3. At least one outcome price (YES/NO/UP/DOWN) is between $0.88 and $0.97.
4. The estimated edge (based on a conservative win probability model) is at least 0.5%.

The strategy computes a "BUY" decision for the qualifying outcome.

## Risk Controls

- **Concurrent Limit**: Limits the total number of bond-related trades to 8 at any given time.
- **Position Cap**: Maximum $8 per trade (or 8% of bankroll).
- **Edge Threshold**: Requires a minimum 0.5% edge (conservative estimation) before firing.
- **Price Constraints**: Only trades between 88c and 97c to avoid ultra-low-return trades or high-risk outcomes.

## Example

1. **Market**: "Will the Fed raise interest rates by 25bps next Wednesday?"
2. **Analysis**: It is Friday. The market resolves in 5 days.
3. **Price**: The "YES" outcome is trading at $0.95.
4. **Volume**: Daily volume is $5,000.
5. **Calculation**:
  - **Days to Resolution**: 5 days (within the 0.5-14 day window).
  - **Proximity Boost**: 0.75% (based on the price being 95c).
  - **Estimated Win Prob**: 95% + 0.75% = 95.75%.
  - **Edge**: 95.75% * (1.0 - 0.95) - (1.0 - 95.75%) * 0.95 = 0.75%.
6. **Execution**: The 0.75% edge meets the 0.5% threshold. A $8 "BUY YES" order is placed.
