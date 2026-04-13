---
sidebar_position: 13
---

# Settlements

The Settlements page provides a historical view of all resolved trades. It is the primary interface for tracking trade outcomes, reconciliation, and profit/loss calculation across all trading strategies.

**Route Path:** `/settlements`

## Layout

The Settlements page is a single-column dashboard centered around a detailed historical table:

- **Settlement History Table**: A paginated list of all settled trades, including the resolved outcome (YES/NO), trade ID, and realized PNL.
- **Record Count**: A top-mounted indicator showing the total number of trade settlements in the system's history.

## Features

- **Resolved Outcomes**: Every settlement includes the final outcome of the associated market (e.g., YES, NO, or a specific price range).
- **PNL Calculation**: The realized profit or loss for each trade is automatically calculated based on the entry price and the settlement amount.
- **Source Tracking**: Settlements are labeled by their data source (Polymarket or Kalshi), ensuring clear attribution for all trades.
- **Time-Based Tracking**: Each record is timestamped to show when the trade was settled.
- **Visual Indicators**: Winning trades are highlighted in green with positive PNL, while losing trades are shown in red with negative PNL.

## Data Sources

The Settlements page is powered by the following API:

- **Settlements API**: `fetchSettlements` (every 30s) providing a paginated list of all resolved trade records.
- **Polymarket/Kalshi Resolution**: Trade settlements are triggered by the official resolution of the prediction market question on the source exchange.

:::tip
Trades only appear in the Settlements tab after the underlying market has officially closed and been resolved by the exchange. This can sometimes take 24-48 hours after the event occurs.
:::
