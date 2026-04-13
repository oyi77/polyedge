---
sidebar_position: 11
---

# WebSockets

WebSocket endpoints provide real-time updates for market price ticks, whale trades, and bot events for the dashboard.

## Endpoints

| Path | Protocol | Description | Auth Required |
|------|----------|-------------|---------------|
| `/ws/markets` | WS | Live market price updates for all watched markets | Yes (Token) |
| `/ws/whales` | WS | Notifications for large trade movements (whale ticks) | Yes (Token) |
| `/ws/events` | WS | Real-time system event logs and trade notifications | Yes (Token) |
| `/api/events/stream` | SSE | Server-Sent Events stream for bot trade updates | Yes (Token) |

## Authentication

WebSocket connections require an authentication token passed as a query parameter.

```bash
ws://localhost:8000/ws/markets?token=<your_admin_token>
```

Failure to provide a valid token results in an immediate connection closure with code `1008 (Policy Violation)`.

## Market Data Feed

The market data feed provides real-time price updates from Polymarket and Kalshi for all markets currently in the bot watch list.

Example Message (**`/ws/markets`**):
```json
{
  "type": "market_tick",
  "ticker": "btc-5m-2026-04-13-10-30",
  "platform": "polymarket",
  "yes_price": 0.58,
  "no_price": 0.42,
  "timestamp": "2026-04-13T10:25:30Z"
}
```

## Whale Trade Notifications

Whale ticks are generated when large trades are detected on supported prediction markets.

Example Message (**`/ws/whales`**):
```json
{
  "type": "whale_trade",
  "wallet": "0x1234...abcd",
  "market": "will-fed-cut-rates-june",
  "size_usd": 15000.0,
  "side": "buy",
  "outcome": "yes",
  "timestamp": "2026-04-13T10:26:00Z"
}
```

## System Event Stream

The system event stream provides real-time logs of bot actions, including strategy execution, signal detection, and trade results.

Example Message (**`/ws/events`**):
```json
{
  "type": "trade",
  "message": "Manual BTC trade: UP btc-5m-2026-04-13-10-30",
  "timestamp": "2026-04-13T10:25:10Z",
  "data": {
    "trade_id": 121,
    "size": 150.0
  }
}
```

:::info
The events stream includes a periodic `heartbeat` message every 2 seconds to ensure the connection remains active.
:::

## Server-Sent Events (SSE)

For clients that do not require full-duplex communication, an SSE stream is available for trade notifications.

**GET `/api/events/stream`**

Example Stream Content:
```text
data: {"type": "connected", "timestamp": "2026-04-13T10:20:00Z"}

data: {"type": "trade_executed", "trade_id": 121, "pnl": 0.0}

: keepalive
```
