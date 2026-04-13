---
sidebar_position: 2
---

# Whale Tracker

The Whale Tracker page provides an interface for monitoring and copying top-performing traders on Polymarket. It scores and ranks wallets based on historical performance, allowing for automated position mirroring.

**Route Path:** `/whale-tracker`

## Layout

The Whale Tracker is divided into three primary functional areas:

- **Status Banner**: A real-time indicator of the Copy Trader strategy health, showing connection status (ok, degraded, error) and the number of currently tracked wallets.
- **Whale Leaderboard**: A sortable, paginated table ranking top Polymarket traders by score, 30-day profit, and win rate.
- **Track Wallet Form**: An administrative input for adding new wallet addresses to the tracking list with optional pseudonyms for easier identification.
- **Active Positions**: A table showing all open trades currently being tracked across the set of followed wallets.

## Features

- **Leaderboard Scoring**: Wallets are ranked using a proprietary score that balances 30-day profit, win rate, and total trade volume.
- **Wallet Filtering**: Search for specific traders by pseudonym or filter by a minimum performance score to find high-conviction targets.
- **Position Tracking**: Monitor the entry time, side (YES/NO), and size for every active trade the tracked whales are holding.
- **Custom Tracking**: Add any Ethereum-compatible wallet address to start monitoring its trading activity on Polymarket.
- **Real-Time Errors**: The status banner highlights any issues with specific data sources, ensuring users are aware of potential tracking lags.

## Data Sources

- **Copy Trader API**: `fetchCopyTraderStatus` (every 15s) and `fetchCopyTraderPositions` (every 15s).
- **Leaderboard API**: `fetchCopyLeaderboard` (every 30s) providing historical PNL and win rate data.
- **Polymarket CLOB**: Real-time position data is derived from tracking whale activity on the Polymarket central limit order book.

:::tip
Pay attention to the "Score" column in the leaderboard. A high score indicates a trader who is not only profitable but also consistent across many unique markets.
:::
