---
sidebar_position: 8
---

# Risk Management

Risk management endpoints manage the safety limits, circuit breakers, and overall portfolio risk of the PolyEdge trading bot.

## Endpoints

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/risk/limits` | Current trading limits and portfolio risk parameters | Yes (Admin) |
| GET | `/api/risk/circuit-breaker` | Current status of the bot circuit breakers | Yes (Admin) |
| POST | `/api/risk/reset-circuit-breaker` | Reset any triggered circuit breaker | Yes (Admin) |
| PUT | `/api/risk/limits` | Update global risk management limits | Yes (Admin) |
| GET | `/api/risk/exposure` | Current portfolio exposure breakdown by strategy | Yes (Admin) |

## Risk Parameters

The bot enforces hard limits on trade size, daily losses, and portfolio concentration.

Example Response (**GET `/api/risk/limits`**):
```json
{
  "max_trade_size_usd": 150.0,
  "daily_loss_limit_usd": 100.0,
  "max_total_pending_trades": 10,
  "kelly_fraction": 0.1,
  "min_edge_threshold": 0.02,
  "daily_drawdown_limit_pct": 0.05,
  "weekly_drawdown_limit_pct": 0.15
}
```

## Circuit Breaker Status

Circuit breakers are triggered when risk limits are exceeded, such as significant drawdowns or excessive losses within a short period.

**GET `/api/risk/circuit-breaker`**

Example Response:
```json
{
  "active": false,
  "reason": null,
  "triggered_at": null,
  "last_reset": "2026-04-10T10:00:00Z"
}
```

:::info
When a circuit breaker is active, all automated strategy execution and order placement are disabled until manually reset by an admin.
:::

## Portfolio Exposure

Exposure analysis provides a breakdown of unsettled trades and the associated risk across strategies.

**GET `/api/risk/exposure`**

Example Response:
```json
{
  "total_exposure_usd": 350.0,
  "total_unsettled_trades": 3,
  "strategy_breakdown": [
    {
      "strategy": "btc_momentum",
      "exposure_usd": 150.0,
      "trade_count": 1,
      "max_loss_potential_usd": 150.0
    },
    {
      "strategy": "weather_emos",
      "exposure_usd": 200.0,
      "trade_count": 2,
      "max_loss_potential_usd": 200.0
    }
  ],
  "platform_breakdown": {
    "polymarket": 350.0,
    "kalshi": 0.0
  }
}
```

## Updating Limits

Admin users can update risk parameters in response to market volatility or changing strategy performance.

**PUT `/api/risk/limits`**

Request Body:
```json
{
  "max_trade_size_usd": 200.0,
  "daily_loss_limit_usd": 150.0
}
```

Example Response:
```json
{
  "status": "updated",
  "new_limits": {
    "max_trade_size_usd": 200.0,
    "daily_loss_limit_usd": 150.0,
    "max_total_pending_trades": 10,
    "kelly_fraction": 0.1,
    "min_edge_threshold": 0.02,
    "daily_drawdown_limit_pct": 0.05,
    "weekly_drawdown_limit_pct": 0.15
  }
}
```

## Resetting Breakers

Manually resetting a circuit breaker allows the bot to resume automated trading after an investigation of the triggering event.

**POST `/api/risk/reset-circuit-breaker`**

Example Response:
```json
{
  "status": "reset",
  "active": false,
  "timestamp": "2026-04-13T10:50:00Z"
}
```
