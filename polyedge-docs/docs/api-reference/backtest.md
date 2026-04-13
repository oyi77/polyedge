---
sidebar_position: 9
---

# Backtesting

Backtesting endpoints allow you to evaluate the performance of trading strategies against historical signals and market data.

## Endpoints

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/backtest` | Run a full backtest based on historical signals | Yes (Admin) |
| GET | `/api/backtest/quick` | Execute a quick backtest for recent N days | Yes (Admin) |
| GET | `/api/backtest/history` | List previous backtest results and configurations | Yes (Admin) |
| GET | `/api/backtest/{backtest_id}` | Detailed results for a specific backtest run | Yes (Admin) |
| DELETE | `/api/backtest/{backtest_id}` | Delete a backtest result record | Yes (Admin) |

## Running a Backtest

A full backtest allows you to configure specific parameters and time ranges for replaying historical signals.

**POST `/api/backtest`**

Request Body:
```json
{
  "initial_bankroll": 1000.0,
  "max_trade_size": 100.0,
  "min_edge_threshold": 0.02,
  "start_date": "2026-03-01T00:00:00Z",
  "end_date": "2026-04-01T00:00:00Z",
  "market_types": ["BTC", "Weather"],
  "slippage_bps": 5
}
```

Example Response:
```json
{
  "strategy_name": "signal_replay",
  "start_date": "2026-03-01T00:00:00Z",
  "end_date": "2026-04-01T00:00:00Z",
  "initial_bankroll": 1000.0,
  "results": {
    "summary": {
      "total_signals": 450,
      "total_trades": 380,
      "winning_trades": 220,
      "losing_trades": 160,
      "win_rate": 0.579,
      "initial_bankroll": 1000.0,
      "final_equity": 1250.45,
      "total_pnl": 250.45,
      "total_return_pct": 25.045,
      "sharpe_ratio": 1.45
    },
    "trade_log": [],
    "equity_curve": []
  }
}
```

:::info
The backtest engine replays signals from the database, applying risk management and Kelly sizing rules defined in the configuration.
:::

## Quick Backtest

The quick backtest endpoint evaluates performance over a set number of recent days with default parameters.

**GET `/api/backtest/quick`**

Query Parameters:
- `days_back` (integer, default 30): Number of recent days to evaluate
- `initial_bankroll` (float, default 1000.0): Starting bankroll

Example Response:
```json
{
  "status": "success",
  "result": {
    "total_trades": 125,
    "winning_trades": 75,
    "losing_trades": 50,
    "total_pnl": 85.50,
    "final_bankroll": 1085.50,
    "win_rate": 0.6,
    "avg_win": 12.50,
    "avg_loss": -15.00,
    "max_drawdown": 45.00,
    "sharpe_ratio": 1.25,
    "trades_per_day": 4.16,
    "roi": 0.0855
  }
}
```

## Backtest History

Results of previous backtest runs are persisted for comparison and analysis.

**GET `/api/backtest/history`**

Example Response:
```json
[
  {
    "id": 15,
    "strategy_name": "btc_momentum_v1",
    "timestamp": "2026-04-10T15:00:00Z",
    "total_trades": 150,
    "total_pnl": 45.50,
    "win_rate": 0.58,
    "start_date": "2026-03-10T00:00:00Z",
    "end_date": "2026-04-10T00:00:00Z"
  }
]
```

## Detailed Results

Individual backtest records include full trade logs and equity curve data for charting.

**GET `/api/backtest/{backtest_id}`**

Example Response:
```json
{
  "id": 15,
  "strategy_name": "btc_momentum_v1",
  "summary": {
    "total_trades": 150,
    "total_pnl": 45.50,
    "win_rate": 0.58
  },
  "trade_log": [
    {
      "timestamp": "2026-03-11T10:00:00Z",
      "ticker": "btc-5m-...",
      "direction": "up",
      "result": "win",
      "pnl": 5.50
    }
  ],
  "equity_curve": [
    {
      "timestamp": "2026-03-11T10:00:00Z",
      "pnl": 5.50,
      "bankroll": 1005.50
    }
  ]
}
```
