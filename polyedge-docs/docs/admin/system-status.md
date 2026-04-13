---
sidebar_position: 1
---

# System Status

The System Status tab provides a real-time overview of the PolyEdge bot's health, connectivity, and active trading mode. It serves as the primary control center for starting, stopping, and resetting the bot.

## Access
Access to this tab requires successful admin login. The dashboard is protected by a password gate that updates the `ADMIN_API_KEY` in the system configuration.

## Trading Modes
PolyEdge supports three distinct trading modes to accommodate different risk levels and testing requirements:

| Mode | Description | Requirements |
|------|-------------|--------------|
| **Paper** | Simulated trades using real-time market data. No real funds are at risk. | None |
| **Testnet** | Real orders executed on the Polygon Amoy testnet (Chain ID 80002). | `POLYMARKET_PRIVATE_KEY` |
| **Live** | Real money trading on the Polygon mainnet. | `POLYMARKET_PRIVATE_KEY`, `POLYMARKET_API_KEY`, `POLYMARKET_API_SECRET`, `POLYMARKET_API_PASSPHRASE` |

:::warning
Switching to **Live** mode involves real financial risk. Ensure all risk parameters and strategies are thoroughly tested in Paper mode before proceeding.
:::

## System Controls

### Bot Start/Stop
The master toggle allows you to manually start or stop the background trading engine.
- **Start**: Initializes the orchestrator and begins polling active strategies.
- **Stop**: Gracefully shuts down active strategy loops and stops new signal generation.

### System Reset
The **Reset** button performs a destructive cleanup of the local environment:
- Clears all trade history from the database.
- Resets the bankroll to the `INITIAL_BANKROLL` value defined in Risk settings.
- Wipes the signal log.

:::warning
Resetting the bot is irreversible. Use this only when restarting a fresh trading session or clearing test data.
:::

## Health Metrics
- **Uptime**: Total time the bot process has been running since the last start.
- **Pending Trades**: Count of trades currently awaiting manual approval or execution.
- **Database Stats**: Total count of recorded signals and trades in the local SQLite/Redis store.
- **Feature Flags**: Visual indicators for the status of Telegram, Kalshi, and Weather integrations.

## How It Works
When the bot starts, it spins up the `Orchestrator` which manages the 9 available trading strategies. The system status component polls the `/api/admin/system/status` endpoint every 10 seconds to update the UI. Switching modes triggers an immediate re-validation of required credentials to prevent unauthorized or broken live trading attempts.
