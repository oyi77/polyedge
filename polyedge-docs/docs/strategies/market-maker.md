---
sidebar_position: 5
---

# Market Maker

The Market Maker strategy aims to provide two-sided liquidity on prediction markets while managing position risk through dynamic spreads and inventory control.

:::info
Market makers profit by capturing the "spread" — the difference between the bid and ask prices — while maintaining a neutral position over time.
:::

## How It Works

The strategy quotes both "bid" and "ask" prices on individual markets. It dynamically adjusts its quotes based on the market's volatility and the bot's current inventory skew to minimize risk.

The technical mechanism includes:
- **Dynamic Spreads**:
  - **Base Spread**: Typically 4% ($0.04).
  - **Volatility Adjustment**: Widens the spread in high-volatility environments (estimated via liquidity proxy).
  - **Inventory Skew**: Widens the spread on the overweight side of the position to encourage trades that neutralize the inventory.
  - **Clamping**: Spread is clamped between `min_spread` (2%) and `max_spread` (15%).
- **Inventory Control**:
  - Tracks open positions from the database for each market.
  - Symmetrically adjusts both bid and ask prices to encourage trades on the underweight side (e.g., if long, it lowers prices to encourage selling).
- **Market Selection**: Prefers high-volume markets ($10k+ daily volume) with existing tight spreads (&lt;10%) and sufficient liquidity ($1k+ on each side).

## Configuration

Relevant environment variables and settings for the Market Maker strategy:

| Variable | Description | Default |
|----------|-------------|---------|
| `base_spread` | The target percentage difference between bid and ask prices. | 0.04 (4%) |
| `max_inventory` | Maximum USD amount to hold in a single market position. | 500.0 |
| `inventory_skew_factor` | How aggressively to skew prices when inventory is lopsided. | 0.5 |
| `quote_size` | The USD amount for each side of the quote. | 25.0 |
| `min_spread` | The absolute minimum spread allowed for quoting. | 0.02 (2%) |
| `max_spread` | The absolute maximum spread allowed for quoting. | 0.15 (15%) |

## Signal Generation

Signals are produced when:
1. Candidate markets are found with sufficient volume and liquidity.
2. The current market mid-price can be estimated from metadata (best bid/ask).
3. The volatility is calculated and the inventory level is determined.
4. Two-sided "QUOTE" decisions are recorded with bid and ask prices.

The strategy computes specific bid/ask prices (clamped between $0.01 and $0.99) and quote sizes.

## Risk Controls

- **Inventory Cap**: Limits the maximum dollar amount held per market to $500.
- **Dynamic Skewing**: Automatically adjusts quotes to return the inventory to neutral.
- **Spread Clamping**: Ensures the spread never narrows too far (increasing risk) or widens too far (making it untradeable).
- **Liquidity Filter**: Only markets with sufficient liquidity are targeted to avoid large slippage on entries or exits.

## Example

1. **Market**: "Who will win the next presidential election?"
2. **Analysis**: Mid-price is $0.50. Market has $50k daily volume and 5% existing spread.
3. **Inventory**: The bot currently holds $100 of YES shares. Max inventory is $500.
4. **Spread**: Base spread is 4%. Volatility is low, so the final spread is 4%.
5. **Skewing**: Because the bot is long ($100), it skews both bid and ask prices slightly lower (e.g., -0.5% skew).
6. **Execution**: The bot quotes:
  - **Bid (Buy YES)**: $0.50 - 2% (half spread) - 0.5% (skew) = $0.475
  - **Ask (Sell YES)**: $0.50 + 2% (half spread) - 0.5% (skew) = $0.515
7. **Result**: A buyer is more likely to buy from the bot's ask (at 51.5c) than a seller is to sell to its bid (at 47.5c), helping to neutralize the inventory.
