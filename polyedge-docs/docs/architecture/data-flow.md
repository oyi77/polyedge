---
sidebar_position: 2
---

# Data Flow

The system processes market data through a series of stages, from initial ingestion to trade execution and settlement.

## Core Data Pipeline

1. **Market Data Ingestion**
   Data clients fetch live prices, orderbook depth, and external context like BTC 1-minute microstructure or GFS ensemble weather forecasts.

2. **Signal Generation**
   The orchestrator triggers registered strategies based on schedules or events. Each strategy processes its signals using the most recent data from the ingestion layer.

3. **AI Signal Analysis**
   If enabled for the strategy, the AI ensemble queries multiple providers (Claude and Groq) to synthesize predictions and sentiment into actionable signals.

4. **Risk Management**
   Before execution, the Risk Manager validates the trade against position limits, portfolio concentration, and circuit breaker status.

5. **Order Execution**
   Valid trades are placed via the Polymarket CLOB SDK or the Kalshi API. The system supports various order types and partial fills.

6. **Settlement and Reconciliation**
   The settlement engine monitors open positions and reconciles outcomes to update P&L and calibrate signal accuracy.

## Data Sources and Refresh Rates

| Source | Data Type | Purpose | Frequency |
|--------|-----------|---------|-----------|
| Coinbase/Kraken/Binance | BTC Candles | Microstructure analysis | 1-minute |
| Open-Meteo | GFS Ensemble | Weather probability forecasting | 6-hourly (model runs) |
| NWS API | Observations | Weather trade settlement | Real-time / hourly |
| Polymarket | Market Prices | Price discovery and execution | WebSocket / polling |
| Kalshi | Market Prices | Price discovery and execution | REST API |

## Real-time Patterns

### WebSocket Market Data
Polymarket market updates are streamed via WebSockets to the backend, reducing latency for price-sensitive strategies like BTC Momentum.

### Polling via TanStack Query
The frontend uses TanStack Query to poll the FastAPI backend. This ensures the dashboard stays in sync with signals, trades, and system status without manual refreshes.

### Event Bus
The backend includes an internal Event Bus for publishing and subscribing to system events. This decouples modules like the WebSocket manager and notification router from the core trading engine.
