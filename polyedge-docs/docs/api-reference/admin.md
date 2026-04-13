---
sidebar_position: 12
---

# Admin

Admin endpoints provide management tools for the bot, including credentials, logs, and overall system configuration.

## Endpoints

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/admin/login` | Authenticate an admin user and return a token | No |
| GET | `/api/admin/verify` | Verify the validity of a current admin token | Yes (Admin) |
| POST | `/api/admin/logout` | Invalidate an admin session and token | Yes (Admin) |
| GET | `/api/events` | List recent system event logs | Yes (Admin) |
| GET | `/metrics` | Prometheus metrics endpoint for monitoring | No |

## Admin Authentication

Access to all protected API routes requires a Bearer token obtained from the login endpoint.

**POST `/api/admin/login`**

Request Body:
```json
{
  "password": "your_admin_password"
}
```

Example Response:
```json
{
  "access_token": "your_jwt_token_here",
  "token_type": "bearer",
  "expires_in": 3600
}
```

:::info
The admin password is configured via the `ADMIN_PASSWORD` environment variable.
:::

## System Event Logs

The event log endpoint provides a structured history of all recent bot actions and system notifications.

**GET `/api/events`**

Query Parameters:
- `limit` (integer, default 50): Number of recent events to retrieve

Example Response:
```json
[
  {
    "timestamp": "2026-04-13T10:30:15Z",
    "type": "success",
    "message": "BTC 5-min trading bot initialized",
    "data": {}
  },
  {
    "timestamp": "2026-04-13T10:35:00Z",
    "type": "info",
    "message": "Manual scan triggered (BTC + Weather)",
    "data": {
      "total_signals": 12,
      "actionable_signals": 2
    }
  }
]
```

## Monitoring and Metrics

PolyEdge exposes a Prometheus-compatible metrics endpoint for tracking request latency, trade throughput, and system resource usage.

**GET `/metrics`**

Example Response Content:
```text
# HELP polyedge_requests_total Total number of HTTP requests
# TYPE polyedge_requests_total counter
polyedge_requests_total{method="GET",path="/api/dashboard"} 1500

# HELP polyedge_trades_total Total number of executed trades
# TYPE polyedge_trades_total counter
polyedge_trades_total{strategy="btc_momentum",platform="polymarket"} 85

# HELP polyedge_pnl_usd Total PNL in USD
# TYPE polyedge_pnl_usd gauge
polyedge_pnl_usd 125.50
```

:::info
The metrics endpoint is intended for ingestion by a Prometheus server or other monitoring tools and returns data in plain text format.
:::

## Token Verification

To check if a token is still valid before making a request, use the verify endpoint.

**GET `/api/admin/verify`**

Example Response:
```json
{
  "valid": true,
  "expires_at": "2026-04-13T11:30:00Z"
}
```
