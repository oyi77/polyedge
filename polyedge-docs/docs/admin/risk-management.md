---
sidebar_position: 3
---

# Risk Management

The Risk Management tab provides a granular interface for configuring the trading bot's safety parameters. These settings govern everything from capital allocation to strategy-specific thresholds.

## Access
Access to the Risk tab requires admin login. The risk settings are stored in the system's `ADMIN_SETTINGS` JSON and hot-reloaded when saved.

## Capital Parameters
Settings related to the total bankroll and portfolio safety:

| Field | Description | Default |
|-------|-------------|---------|
| **Initial Bankroll ($)** | The starting capital amount for the bot. This is used as the base for P&L calculations after a **Reset**. | 10000 |
| **Daily Loss Limit ($)** | A hard stop that ceases all trading for the day if the daily P&L drops below this negative value. | -- |

## BTC Strategy Risk
Specific risk controls for the BTC Oracle and momentum strategies:

| Field | Description | Default |
|-------|-------------|---------|
| **Max Trade Size ($)** | The absolute maximum size, in USDC, allowed for any single BTC-related trade. | -- |
| **Min Edge Threshold** | The minimum required "edge" (e.g., `0.02` for 2%) before the bot will consider a trade. | 0.02 |
| **Kelly Fraction** | The fractional Kelly multiplier (e.g., `0.15` for 15% of the calculated Kelly size). | 0.15 |
| **Max Pending Trades** | A circuit breaker that prevents new trades if the count of open positions exceeds this number. | -- |

## Weather Strategy Risk
Dedicated risk parameters for temperature-based prediction markets:

| Field | Description | Default |
|-------|-------------|---------|
| **Weather Max Trade Size ($)** | The maximum USDC amount for a single weather-based trade. | -- |
| **Weather Min Edge** | The minimum required edge for weather signals (e.g., `0.08` for 8%). | 0.08 |

## How It Works
Risk parameters are applied in real-time by the `RiskManager` module within the trading engine. When a signal is generated, it must pass through these filters before being considered for execution. 
- **Kelly Sizing**: The bot calculates the optimal position size using the Kelly Criterion based on the estimated edge and confidence. This value is then multiplied by the **Kelly Fraction** and capped by the **Max Trade Size**.
- **Edge Filtering**: Signals with an edge lower than the defined **Min Edge Threshold** are automatically discarded.

:::warning
Changes to risk parameters take effect immediately through hot-reloading. However, updating the **Initial Bankroll** requires a system **Reset** in the System tab to take effect for P&L tracking.
:::

:::tip
Start with a low **Kelly Fraction** (e.g., `0.05` to `0.10`) to minimize drawdown during the initial testing phase.
:::
