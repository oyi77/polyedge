---
sidebar_position: 1
---

# Overview Tab

The Overview tab provides a real-time summary of your trading terminal's status. It's designed for high-level monitoring and quick action, combining market data, equity tracking, and active signal feeds into a single view.

## What You'll See

The tab uses a specialized three-column layout to organize different aspects of the system's performance.

### Left Column: System Health & Execution
- **Microstructure Panel**: Shows real-time market metrics like bid-ask spread and order book depth.
- **Equity Chart**: A visual representation of your portfolio's value over time.
- **Performance Stats**: Quick comparison between Paper and Live trading performance, including P&L, trade count, and win rate.
- **Calibration**: Displays how well predicted probabilities match actual outcomes (Brier score tracking).
- **Terminal**: A command-line style interface showing recent system logs and providing manual controls to start, stop, or scan for opportunities.

### Center Column: Market Intelligence
- **3D Globe**: A geospatial visualization of weather-based markets and forecasts across the world.
- **Edge Distribution**: A histogram showing the concentration of trading "edge" across different markets.
- **BTC Windows**: A feed of active and upcoming Bitcoin price prediction windows, including price targets and time remaining.
- **Weather Panel**: Detailed breakdown of active weather forecasts and their associated trading signals.

### Right Column: Signal & Trade Feeds
- **Signals Panel**: A toggleable feed between "Live" actionable signals and recent signal "History."
- **Recent Trades**: A table of the most recently executed trades, their entry prices, and current status.

## Understanding the Data

| Component | Metric | Meaning |
|-----------|--------|---------|
| Microstructure | Spread | The difference between the highest buy price and lowest sell price. |
| Equity Chart | Total Equity | Your current bankroll plus any unrealized profits or losses. |
| BTC Windows | Target Price | The specific price level (in cents) the market is predicting for Bitcoin. |
| Calibration | Settled | The number of trades used to calculate the current model accuracy. |
| Terminal | Scan | Triggers an immediate search for new opportunities across all enabled strategies. |

## Controls

You can interact with the terminal buttons at the bottom of the left column:
- **Start/Stop**: Toggle the automated trading engine.
- **Scan**: Manually trigger a market scan.
- **Simulate**: Located in the Signals panel, allows you to test a signal without risking real capital.

:::tip
The dashboard data refreshes every 10 seconds by default. You can track the next update via the refresh bar in the footer.
:::

:::info
The 3D Globe uses real-time data from Open-Meteo and the National Weather Service (NWS) to visualize global weather signals.
:::
