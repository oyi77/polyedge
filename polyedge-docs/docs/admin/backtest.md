---
sidebar_position: 13
---

# Backtesting Engine

The Backtesting Engine provides a comprehensive interface for simulating trading strategies on historical market data. It allows you to test different parameter configurations and evaluate their performance before deploying to live trading.

## Access
Access to the Backtesting Engine requires admin login. Backtesting is performed using the bot's historical data and strategies stored in the system database.

## Backtest Engine Controls
The top section provides controls for configuring and running a backtest:

| Field | Description |
|-------|-------------|
| **Strategy** | A dropdown menu to select the strategy to test (e.g., `btc_oracle`, `weather_emos`). |
| **Start Date** | The beginning date for the backtest period. |
| **End Date** | The ending date for the backtest period. |
| **Initial Bankroll ($)** | The starting capital for the backtest simulation. |
| **Strategy Parameters** | A list of strategy-specific parameters that can be adjusted for the backtest. |

:::tip
Default parameters for each strategy are automatically populated when a strategy is selected.
:::

## Running a Backtest
The **Run Backtest** button initiates a backtest simulation based on the configured parameters:
- **Running Backtest...**: The bot is currently simulating trades for the selected period.
- **Run Backtest**: Triggers the backtest simulation.

## Backtest Results
When a backtest simulation is completed, the results are displayed in a summary card:

### Summary Cards
The top section highlights the key performance metrics for the backtest:
- **Total Return**: Overall profit or loss as a percentage (color-coded for visibility).
- **Win Rate**: The percentage of winning trades (0-100%).
- **Total P&L**: Total profit or loss in USDC (color-coded for visibility).
- **Sharpe Ratio**: A risk-adjusted performance metric (higher = better).

### Trade Log Table
The middle section displays a detailed log of all trades executed during the backtest simulation:

| Column | Description |
|--------|-------------|
| **#** | The unique identifier for the trade in the backtest. |
| **Date** | The date and time of the trade. |
| **Entry** | The entry price for the trade (in cents). |
| **Exit** | The exit price for the trade (in cents). |
| **Size** | The USDC size for the trade. |
| **P&L** | Total profit or loss for the trade (color-coded for visibility). |
| **Result** | The trade outcome: **WIN** (Green) or **LOSS** (Red). |
| **Bankroll** | The remaining bankroll after the trade. |

## Backtest History
The bottom section lists the history of recent backtest runs:
- **Strategy Name**: The name of the backtested strategy.
- **Date Range**: The period for which the backtest was run.
- **P&L**: Total profit or loss for the backtest run.
- **Return**: Overall profit or loss as a percentage.

## How It Works
The Backtesting Engine interacts with the `/api/backtest/strategies`, `/api/backtest/run`, and `/api/backtest/history` endpoints for all operations.
- **Simulation**: The bot uses historical market data and signals to simulate trade execution and P&L calculations.
- **Parametrization**: Backtesting allows you to test different parameter configurations and identify the most profitable settings for each strategy.
- **Persistence**: Backtest results are stored in the system database for historical review and comparison.

:::warning
Backtest results are based on historical data and do not guarantee future performance in live trading.
:::

:::tip
Use the **Backtesting Engine** to refine your trading strategies and optimize your risk parameters before switching to live mode.
:::
