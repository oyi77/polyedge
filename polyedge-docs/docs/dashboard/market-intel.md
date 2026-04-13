---
sidebar_position: 10
---

# Market Intel

The Market Intel page provides a centralized view of the bot's core trading infrastructure. It gives users the ability to monitor strategy health, toggle active strategies, and manage specific markets for continuous scanning.

**Route Path:** `/market-intel`

## Layout

The page is organized into three primary modules:

- **Strategy Health Grid**: A status dashboard showing the heartbeat, lag (in seconds/minutes), and overall health (healthy/stale) for every active trading strategy.
- **Active Strategies Panel**: A list of configured strategies with enable/disable toggles, category labels, and manual "Run Now" buttons.
- **Market Watch Section**: A table of tickers (e.g., BTC-USD) that the bot is actively scanning for price and momentum signals.

## Features

- **Health Monitoring**: Monitor the bot's main process and see if individual strategies are falling behind (stale) or running as expected (healthy).
- **Strategy Control**: Toggle any of the 9 core trading strategies (such as BTC Oracle, Weather EMOS, or Kalshi Arb) in real-time.
- **Manual Overrides**: The "Run Now" button allows for immediate signal generation without waiting for the next scheduled interval.
- **Market Watch CRUD**: Add or remove specific tickers to the bot's market scanner with custom categories for easier organization.
- **Filtering**: Search and filter the Market Watch table by ticker, category, or source.

## Data Sources

The Market Intel page is powered by the following API endpoints:

- **Health API**: `fetchHealth` (every 15s) for per-strategy heartbeat and lag data.
- **Strategies API**: `fetchStrategies` (every 30s) providing metadata, descriptions, and current enable/disable state.
- **Market Watch API**: `fetchMarketWatches` (every 30s) for the list of scanned tickers and their configurations.

:::tip
A strategy is marked as "Stale" if its last heartbeat exceeds a predefined threshold. Check the lag time to see if the bot process or the data source is experiencing delays.
:::
