---
sidebar_position: 5
---

# Markets

Market endpoints provide real-time price feeds, market listings, and status information for Polymarket and Kalshi.

## Endpoints

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/btc/price` | Current BTC price and market momentum data | No |
| GET | `/api/btc/windows` | Active BTC 5-minute prediction windows | No |
| GET | `/api/polymarket/markets` | General Polymarket active markets with volume data | No |
| GET | `/api/kalshi/status` | Connection status and current Kalshi balance | No |
| GET | `/api/weather/forecasts` | Active weather ensemble forecast data | No |
| GET | `/api/weather/markets` | Weather temperature markets on all platforms | No |
| GET | `/api/markets/watch` | Manage user-watched markets for signal generation | Yes (Admin) |

## BTC Price and Windows

BTC market data is pulled from aggregators to determine the state of 5-minute prediction windows.

Example Response (**GET `/api/btc/price`**):
```json
{
  "price": 65123.45,
  "change_24h": 0.024,
  "change_7d": -0.012,
  "market_cap": 1280000000,
  "volume_24h": 2500000000,
  "last_updated": "2026-04-13T10:25:00Z"
}
```

Example Response (**GET `/api/btc/windows`**):
```json
[
  {
    "slug": "btc-5m-2026-04-13-10-30",
    "market_id": "btc-5m-2026-04-13-10-30",
    "up_price": 0.58,
    "down_price": 0.42,
    "window_start": "2026-04-13T10:25:00Z",
    "window_end": "2026-04-13T10:30:00Z",
    "volume": 12500.0,
    "is_active": true,
    "is_upcoming": false,
    "time_until_end": 15.0,
    "spread": 0.015
  }
]
```

## Polymarket Active Markets

General market data for non-BTC markets.

**GET `/api/polymarket/markets`**

Example Response:
```json
{
  "markets": [
    {
      "ticker": "POL-2026-04-13-001",
      "slug": "will-fed-cut-rates-june",
      "question": "Will the Federal Reserve cut rates in June?",
      "category": "economics",
      "yes_price": 0.45,
      "no_price": 0.55,
      "volume": 250000.0,
      "liquidity": 12000.0,
      "end_date": "2026-06-15T10:00:00Z"
    }
  ],
  "total": 45,
  "offset": 0,
  "limit": 100
}
```

## Weather Markets

Weather endpoints focus on temperature prediction markets.

Example Response (**GET `/api/weather/markets`**):
```json
[
  {
    "slug": "will-nyc-high-exceed-75",
    "market_id": "NYC-2026-04-14-75",
    "platform": "polymarket",
    "title": "Will NYC High Temperature exceed 75°F on 2026-04-14?",
    "city_key": "NYC",
    "city_name": "New York City",
    "target_date": "2026-04-14T00:00:00Z",
    "threshold_f": 75.0,
    "metric": "high",
    "direction": "above",
    "yes_price": 0.55,
    "no_price": 0.45,
    "volume": 5000.0
  }
]
```

## Kalshi Connection

The Kalshi status endpoint verifies your API credentials and returns account balance.

**GET `/api/kalshi/status`**

Example Response:
```json
{
  "connected": true,
  "balance": {
    "account_number": "K12345",
    "balance": 1025.50,
    "buying_power": 950.00
  }
}
```

:::info
Kalshi connectivity requires a valid `KALSHI_API_KEY_ID` and `KALSHI_PRIVATE_KEY_PATH` in your `.env` file.
:::

## Market Watch List

Managed by admin users to target specific markets for strategy scanning.

**POST `/api/markets/watch`**

Request Body:
```json
{
  "ticker": "NYC-2026-04-14-75",
  "category": "weather",
  "source": "user",
  "enabled": true
}
```
Example Response:
```json
{
  "id": 1,
  "ticker": "NYC-2026-04-14-75",
  "category": "weather",
  "source": "user",
  "enabled": true,
  "created_at": "2026-04-13T10:30:00Z"
}
```
