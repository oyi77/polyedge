---
sidebar_position: 1
---

# BTC Momentum

The BTC Momentum strategy is a technical analysis-based approach for short-term Bitcoin price prediction markets. It identifies trending movements in the Bitcoin price using classic momentum indicators and attempts to capture alpha on high-frequency binary markets.

:::warning
This strategy is currently documented as having negative expected value (EV) in live trading (-49.5% ROI on a small sample). It's kept in the codebase for research and paper trading purposes only. For live Bitcoin trading, use the [BTC Oracle](./btc-oracle.md) strategy instead.
:::

## How It Works

The strategy analyzes the price microstructure of Bitcoin across multiple major exchanges, including Coinbase, Kraken, and Binance. It specifically targets 5-minute binary markets on Polymarket.

The technical mechanism includes:
- **Candle Analysis**: Fetches 60 one-minute candles to build a short-term history.
- **Indicators**: Computes a composite signal from five technical indicators:
  - **RSI(14)**: Relative Strength Index to identify overbought or oversold conditions.
  - **Momentum**: Calculated across 1m, 5m, and 15m intervals.
  - **VWAP Deviation**: Measures how far the current price has strayed from the Volume Weighted Average Price.
  - **SMA Crossover**: Simple Moving Average crossovers for trend detection.
  - **Market Skew**: Analysis of the order book imbalance.
- **Convergence Filter**: Requires at least 2 of the 4 primary indicators to agree on the direction before generating a signal.

## Configuration

The strategy behavior is controlled by these parameters:

| Variable | Description | Default |
|----------|-------------|---------|
| `interval_seconds` | Frequency of the strategy execution cycle. | 60 |
| `max_trades_per_scan` | Maximum number of trades to attempt in a single scan. | 2 |
| `max_trade_fraction` | Maximum fraction of the bankroll to risk on a single trade. | 0.03 |

## Signal Generation

Signals are produced when the weighted composite model generates an "UP" probability outside the neutral 0.35 to 0.65 range. The resulting model probability is compared against the market prices on Polymarket. A trade is considered when the detected edge (model probability minus market probability) exceeds the 2% threshold.

## Risk Controls

- **Edge Threshold**: Minimum 2% absolute edge required to fire a signal.
- **Position Sizing**: Uses Fractional Kelly sizing, typically capped at 5% of the total bankroll.
- **Trade Limits**: Individual trades are capped at $75 per position.

## Example

1. **Analysis**: The bot fetches the last 60 minutes of BTC price data. RSI is at 30 (oversold) and the 5m momentum is positive.
2. **Signal**: 2/4 indicators agree on an upward move. The model computes a 70% probability of BTC being above the target price.
3. **Market Check**: Polymarket YES shares for the 5m window are trading at $0.60 (60% probability).
4. **Execution**: The 10% edge (70% - 60%) exceeds the 2% threshold. In paper mode, the bot "buys" YES shares.
