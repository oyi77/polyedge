---
sidebar_position: 6
---

# Strategies

Strategy endpoints allow for the management, configuration, and monitoring of trading strategies within the PolyEdge system.

## Endpoints

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/strategies` | List all registered strategies with current configurations | Yes (Admin) |
| GET | `/api/strategies/{name}` | Detailed configuration for a single strategy | Yes (Admin) |
| PUT | `/api/strategies/{name}` | Update strategy enabled state, interval, or parameters | Yes (Admin) |
| POST | `/api/strategies/{name}/run-now` | Trigger an immediate manual execution of a strategy | Yes (Admin) |
| GET | `/api/stats/strategies` | Historical P&L breakdown and performance by strategy | Yes (Admin) |

## Strategy Listing

Each strategy has a unique name, description, and configurable parameters stored in the database.

Example Response (**GET `/api/strategies`**):
```json
[
  {
    "name": "btc_momentum",
    "description": "RSI + momentum + VWAP on 1m/5m/15m candles",
    "category": "crypto",
    "enabled": true,
    "interval_seconds": 60,
    "params": {
      "max_trade_fraction": 0.03
    },
    "default_params": {
      "max_trade_fraction": 0.03
    },
    "updated_at": "2026-04-10T15:00:00Z",
    "required_credentials": []
  },
  {
    "name": "weather_emos",
    "description": "31-member GFS ensemble temperature forecasting",
    "category": "weather",
    "enabled": true,
    "interval_seconds": 300,
    "params": {
      "min_edge": 0.05,
      "max_position_usd": 100
    },
    "default_params": {
      "min_edge": 0.05,
      "max_position_usd": 100
    },
    "updated_at": "2026-04-12T09:30:00Z",
    "required_credentials": []
  }
]
```

## Strategy Management

Strategies can be enabled or disabled, and their scan intervals and internal parameters can be modified via PUT requests.

**PUT `/api/strategies/{name}`**

Request Body:
```json
{
  "enabled": true,
  "interval_seconds": 120,
  "params": {
    "max_trade_fraction": 0.05
  }
}
```

Example Response:
```json
{
  "name": "btc_momentum",
  "enabled": true,
  "interval_seconds": 120,
  "params": {
    "max_trade_fraction": 0.05
  },
  "updated_at": "2026-04-13T10:35:00Z"
}
```

## Strategy Performance

Historical performance analysis categorized by strategy name, including win rate, P&L, and average edge.

**GET `/api/stats/strategies`**

Example Response:
```json
{
  "strategies": [
    {
      "strategy": "btc_momentum",
      "total_trades": 85,
      "wins": 55,
      "losses": 30,
      "pending": 0,
      "win_rate": 0.647,
      "total_pnl": 145.20,
      "avg_edge": 0.045,
      "avg_size": 150.0
    },
    {
      "strategy": "weather_emos",
      "total_trades": 25,
      "wins": 18,
      "losses": 7,
      "pending": 2,
      "win_rate": 0.72,
      "total_pnl": 85.50,
      "avg_edge": 0.072,
      "avg_size": 100.0
    }
  ]
}
```

## Manual Run

Triggering a manual run of a strategy skips the scheduler and identifies signals immediately based on current market data.

**POST `/api/strategies/{name}/run-now`**

Example Response:
```json
{
  "status": "ok",
  "name": "btc_momentum"
}
```

:::info
Manual runs do not change the existing scheduler intervals and are intended for testing and debugging.
:::
