---
sidebar_position: 2
---

# Bot Control

Bot control endpoints allow you to manage the execution of the trading bot, including starting, pausing, and resetting its state.

## Endpoints

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/health` | System health check and strategy status | No |
| POST | `/api/bot/start` | Start the trading bot scheduler | Yes (Admin) |
| POST | `/api/bot/stop` | Pause the trading bot scheduler | Yes (Admin) |
| POST | `/api/bot/reset` | Reset bot state and trade history | Yes (Admin) |
| POST | `/api/run-scan` | Trigger immediate market scan | Yes (Admin) |

## Health Check

The health check endpoint provides a status overview of the bot and its registered trading strategies.

**GET `/api/health`**

Example Response:
```json
{
  "status": "ok",
  "strategies": [
    {
      "name": "btc_momentum",
      "healthy": true,
      "last_run": "2026-04-13T10:30:00Z",
      "lag_seconds": 15
    },
    {
      "name": "weather_emos",
      "healthy": true,
      "last_run": "2026-04-13T10:25:00Z",
      "lag_seconds": 300
    }
  ],
  "timestamp": "2026-04-13T10:30:15Z",
  "bot_running": true
}
```

:::info
The `lag_seconds` field indicates how long it has been since a strategy last executed compared to its configured interval.
:::

## Bot Lifecycle

Starting the bot initializes the APScheduler, which handles periodic tasks for signal scanning and trade settlement.

**POST `/api/bot/start`**

Example Response:
```json
{
  "status": "started",
  "is_running": true
}
```

**POST `/api/bot/stop`**

Example Response:
```json
{
  "status": "stopped",
  "is_running": false
}
```

## Reset State

The reset endpoint clears all trade history and AI logs, returning the bot to its initial bankroll. This action requires an explicit confirmation.

**POST `/api/bot/reset`**

Request Body:
```json
{
  "confirm": true
}
```

Example Response:
```json
{
  "status": "reset",
  "trades_deleted": 150,
  "ai_logs_deleted": 45,
  "new_bankroll": 10000.0
}
```
