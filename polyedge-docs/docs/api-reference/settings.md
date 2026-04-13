---
sidebar_position: 7
---

# Settings

Settings endpoints manage user configurations and system parameters for the trading bot.

## Endpoints

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/signal-config` | Current signal approval and notification settings | No |
| GET | `/api/wallets` | List configured trading wallets and their balances | Yes (Admin) |
| POST | `/api/wallets` | Configure a new trading wallet | Yes (Admin) |
| PUT | `/api/wallets/{wallet_id}` | Update wallet configuration | Yes (Admin) |
| DELETE | `/api/wallets/{wallet_id}` | Remove a configured wallet | Yes (Admin) |

## Signal Configuration

The signal configuration endpoint provides settings for user approval workflows and front-end notification behavior.

Example Response (**GET `/api/signal-config`**):
```json
{
  "approval_mode": "manual",
  "min_confidence": 0.85,
  "notification_duration_ms": 5000
}
```

:::info
The `approval_mode` can be `manual`, `auto_approve`, or `auto_deny`, as defined in your system configuration.
:::

## Wallet Management

Wallet configurations store the credentials required for order execution on different platforms.

Example Response (**GET `/api/wallets`**):
```json
[
  {
    "id": 1,
    "platform": "polymarket",
    "address": "0x1234...abcd",
    "is_active": true,
    "balance": 1025.50,
    "created_at": "2026-04-10T10:00:00Z"
  },
  {
    "id": 2,
    "platform": "kalshi",
    "address": "kalshi_api_key_id",
    "is_active": true,
    "balance": 500.0,
    "created_at": "2026-04-11T12:30:00Z"
  }
]
```

## Configuring Wallets

New wallets can be added by providing the platform and necessary credentials.

**POST `/api/wallets`**

Request Body:
```json
{
  "platform": "polymarket",
  "address": "0x1234...abcd",
  "private_key": "your_private_key_here",
  "is_active": true
}
```

Example Response:
```json
{
  "id": 3,
  "platform": "polymarket",
  "address": "0x1234...abcd",
  "is_active": true,
  "created_at": "2026-04-13T10:40:00Z"
}
```

:::info
Private keys and sensitive credentials are encrypted before being stored and are never returned in plain text via the API.
:::

## Updating Wallet Settings

The active state of a wallet can be toggled to enable or disable trading on a specific platform.

**PUT `/api/wallets/{wallet_id}`**

Request Body:
```json
{
  "is_active": false
}
```

Example Response:
```json
{
  "id": 3,
  "is_active": false,
  "updated_at": "2026-04-13T10:45:00Z"
}
```
