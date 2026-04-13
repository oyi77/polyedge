---
sidebar_position: 8
---

# Market Watchlist

The Market Watch tab provides a granular interface for managing the list of prediction markets that the PolyEdge bot is currently monitoring. It allows you to add or remove specific markets and categorize them for targeted analysis.

## Access
Access to the Market Watch tab requires admin login. The watchlist is stored in the system's `MARKET_WATCHES` database table and is synchronized with the strategy engine.

## Market Table
A real-time table lists all markets currently in the watchlist:

| Column | Description |
|--------|-------------|
| **Ticker** | The unique ticker symbol or ID for the market (e.g., `BTC-100k-FRI`). |
| **Category** | An optional label to group similar markets (e.g., `BTC`, `Weather`). |
| **Source** | The market provider (e.g., `Polymarket`, `Kalshi`). |
| **Enabled** | Visual indicator showing if the market is **Enabled** (Green) or **Disabled** (Gray). |
| **Action** | The **Delete** button (×) to remove the market from the watchlist. |

:::tip
Disabled markets are not scanned by active strategies. Use this feature to pause tracking without deleting the market configuration.
:::

## Market Controls

### Add Market Watch
The **Add Market Watch** form allows you to manually add a new market to the system's monitoring loop:
- **Ticker**: The ticker symbol or ID of the market you want to track.
- **Category (Optional)**: A user-defined category to help organize the watchlist.
- **Add**: Commits the new market to the database and refreshes the watchlist.

### Delete Market
Clicking the **Delete** button (×) removes the market from the watchlist and clears any associated monitoring data.

## How It Works
The Market Watch tab interacts with the `/api/admin/market-watches` endpoint for all CRUD operations.
- **Scan Loop**: Active strategies use the enabled markets in the watchlist as their primary data source.
- **Categorization**: Strategies can filter their analysis based on the category assigned to each market (e.g., the weather strategy only scans markets in the `Weather` category).

:::warning
Removing a market from the watchlist while the bot is running will immediately stop all analysis for that market.
:::

:::tip
Use the **Market Watch** tab to test new markets before enabling full-scale automated trading.
:::
