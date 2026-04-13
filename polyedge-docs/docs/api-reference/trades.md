---
sidebar_position: 4
---

# Trades

Trade endpoints manage executed orders and trade history across all platforms and trading modes.

## Endpoints

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/trades` | List executed trades with settlement status | Yes (Admin) |
| GET | `/api/stats` | Aggregate bot statistics and PNL metrics | Yes (Admin) |
| GET | `/api/equity-curve` | Cumulative PNL data over time | Yes (Admin) |
| POST | `/api/simulate-trade` | Execute a manual trade for a given signal | Yes (Admin) |
| POST | `/api/settle-trades` | Manually trigger settlement check | Yes (Admin) |

## Trade Record Object

A trade represents an executed position in a prediction market.

Example Response (**GET `/api/trades`**):
```json
[
  {
    "id": 120,
    "market_ticker": "btc-5m-2026-04-13-10-30",
    "platform": "polymarket",
    "event_slug": "btc-5m-2026-04-13-10-30",
    "direction": "up",
    "entry_price": 0.58,
    "size": 150.0,
    "timestamp": "2026-04-13T10:25:10Z",
    "settled": false,
    "result": "pending",
    "pnl": 0.0,
    "strategy": "btc_momentum",
    "signal_source": "btc_momentum",
    "confidence": 0.82
  }
]
```

## Bot Statistics

Stats provide a snapshot of performance for the current trading mode.

**GET `/api/stats`**

Example Response:
```json
{
  "bankroll": 10125.50,
  "total_trades": 120,
  "winning_trades": 72,
  "win_rate": 0.6,
  "total_pnl": 125.50,
  "is_running": true,
  "mode": "paper",
  "open_exposure": 150.0,
  "open_trades": 1
}
```

:::info
Top-level fields always reflect the ACTIVE trading mode defined in your configuration.
:::

## PNL and Equity Curve

Cumulative PNL over time, used for charting the bot performance.

**GET `/api/equity-curve`**

Example Response:
```json
[
  {
    "timestamp": "2026-04-13T09:00:00Z",
    "pnl": 25.00,
    "bankroll": 10025.00,
    "trade_id": 101
  },
  {
    "timestamp": "2026-04-13T10:00:00Z",
    "pnl": 55.00,
    "bankroll": 10055.00,
    "trade_id": 115
  }
]
```

## Manual Actions

Manual execution and settlement are available for testing or handling unresolved markets.

**POST `/api/simulate-trade`**

Query Parameter:
- `signal_ticker` (string, required): Ticker ID of the signal to execute

Example Response:
```json
{
  "status": "ok",
  "trade_id": 121,
  "size": 150.0
}
```

**POST `/api/settle-trades`**

Example Response:
```json
{
  "status": "ok",
  "settled_count": 2,
  "trades": [
    {
      "id": 118,
      "result": "win",
      "pnl": 12.50
    },
    {
      "id": 119,
      "result": "loss",
      "pnl": -15.00
    }
  ]
}
```
