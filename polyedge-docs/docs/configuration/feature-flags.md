---
sidebar_position: 3
---

# Feature Flags

PolyEdge uses feature flags to toggle various components of the trading system on or off. These flags allow you to customize your bot for specific trading styles, such as paper trading, manual approval workflows, or fully autonomous trading.

## Master Controls

| Flag | Default | Description |
| --- | --- | --- |
| `TRADING_MODE` | `paper` | **Paper Mode**: Virtual bankroll and simulated execution. **Live Mode**: Real fund allocation and order placement on Polymarket. |
| `SIGNAL_APPROVAL_MODE` | `manual` | **Manual**: Always requires user approval via the dashboard or API. **Auto Approve**: Automatically executes signals above the confidence threshold. |
| `AUTO_TRADER_ENABLED` | `false` | Enable or disable the automated trade placement logic. |

## Strategy Toggles

Enable or disable specific strategies based on your risk appetite and market preferences.

| Flag | Default | Description |
| --- | --- | --- |
| `WEATHER_ENABLED` | `true` | Enables the temperature forecasting strategy using GFS ensemble data. |
| `KALSHI_ENABLED` | `false` | Toggles data fetching and order placement for Kalshi markets. |
| `WHALE_LISTENER_ENABLED` | `false` | Enables real-time tracking of high-volume traders for signal generation. |
| `ARBITRAGE_DETECTOR_ENABLED` | `false` | Scans for cross-platform price gaps between Polymarket and Kalshi. |

## AI Feature Flags

Control how the bot uses Large Language Models (LLMs) to enhance trading signals.

| Flag | Default | Description |
| --- | --- | --- |
| `AI_ENABLED` | `false` | The master switch for all AI-enhanced signals and ensemble analysis. |
| `WEBSEARCH_ENABLED` | `true` | Allows the bot to use search providers like Tavily or Exa for market research. |
| `AI_LOG_ALL_CALLS` | `true` | Logs full request and response payloads from AI providers for debugging. |

## Infrastructure and Automation

| Flag | Default | Description |
| --- | --- | --- |
| `JOB_WORKER_ENABLED` | `false` | Offloads background tasks to a dedicated worker process (recommended for production). |
| `AUTO_IMPROVE_ENABLED` | `true` | Enables periodic learning from trade outcomes to refine strategy parameters. |
| `SELF_REVIEW_ENABLED` | `true` | Automates daily trade attribution and system degradation checks. |
| `RESEARCH_PIPELINE_ENABLED` | `true` | Runs continuous market research to find new trading opportunities. |

## Recommended Defaults

| Configuration | `TRADING_MODE` | `SIGNAL_APPROVAL` | `AUTO_TRADER` | `AI_ENABLED` |
| --- | --- | --- | --- | --- |
| **New User (Paper)** | `paper` | `manual` | `false` | `false` |
| **Active Trader (Paper)** | `paper` | `manual` | `true` | `true` |
| **Pro (Live)** | `live` | `auto_approve` | `true` | `true` |
