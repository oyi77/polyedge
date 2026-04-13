---
sidebar_position: 4
---

# Markets Tab

The Markets tab provides a paginated view of all available prediction markets on Polymarket. It serves as a browser for identifying potential trading opportunities and monitoring market sentiment.

## What You'll See

This tab is organized into:
1. **Header Row**: Summary stats for the current page of markets.
2. **Markets Table**: A detailed list of all active prediction markets.

## Understanding the Data

### Markets Columns

| Column | Description |
|--------|-------------|
| **Ticker** | The unique identifier for the market. |
| **Question** | The specific question or event the market is predicting. |
| **Yes** | The cost (in cents) to buy a "YES" position (e.g., `65.5c` implies a 65.5% probability). |
| **No** | The cost (in cents) to buy a "NO" position. |
| **Volume** | The total dollar amount traded on this market. |

## Controls

You can use the pagination controls at the bottom of the table to navigate through all available markets.
- **Previous/Next**: Move between pages of markets (50 per page).

## Tips

:::tip
Higher **Volume** typically indicates more liquid markets, which generally have lower slippage and more efficient pricing.
:::

:::info
The markets list automatically refreshes every 60 seconds to provide the most current prices and volume data.
:::

:::warning
Prices on prediction markets can move rapidly. The values shown represent the last updated price from the Polymarket API.
:::
