---
sidebar_position: 1
---

# Landing Page

The Landing page is the primary entry point for the PolyEdge platform. It provides a high level overview of the system capabilities, active trading strategies, and supported execution modes.

**Route Path:** `/`

## Layout

The page is organized into several functional sections designed to introduce users to the platform:

- **Navigation Bar**: Top-mounted sticky bar providing quick access to the Dashboard, Whale Tracker, Market Intel, Decision Log, Settlements, and Admin panel.
- **Hero Section**: Displays the current version, strategy count, and primary call-to-action buttons for entering the live dashboard or reviewing decisions.
- **Trading Modes**: A dedicated area explaining the three supported environments (Paper, Testnet, and Live).
- **Strategy Cards**: High-level summaries of the five core alpha strategies currently running on the platform.
- **Platform Capabilities**: A grid detailing key system features like Kelly sizing, real-time events, and the decision log.
- **Trade Pipeline**: A visual step-by-step breakdown of how the bot moves from market scanning to trade settlement.

## Features

- **Mode Selection**: Users can immediately see the differences between risk-free paper trading and live mainnet execution.
- **Strategy Insights**: Each card provides a brief description of the logic behind the strategy, such as GEFS ensemble forecasts for weather or RSI/VWAP for BTC.
- **Direct Navigation**: Action buttons allow users to jump straight into monitoring (Dashboard) or configuration (Admin).
- **Version Tracking**: The footer and hero sections display the current system version for consistency.

## Data Sources

The Landing page is a static overview component and does not pull real-time trading data. It serves as a structural map of the system's capabilities. Information about active strategies and modes is derived from the frontend configuration.

:::tip
New users should start by reviewing the "Trade Pipeline" section to understand how PolyEdge automates the discovery and execution of market edges.
:::
