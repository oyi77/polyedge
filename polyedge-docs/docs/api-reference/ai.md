---
sidebar_position: 10
---

# AI Signal Analysis

AI signal endpoints manage the configuration and status of the AI ensemble used for signal enhancement and analysis.

## Endpoints

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/ai/status` | AI system status, provider config, and budget usage | Yes (Admin) |
| POST | `/api/ai/toggle` | Enable or disable AI-enhanced signals globally | Yes (Admin) |
| GET | `/api/decisions` | List AI decision log entries with reasoning and outcomes | Yes (Admin) |
| GET | `/api/decisions/{id}` | Detailed reasoning and signal data for a specific decision | Yes (Admin) |
| GET | `/api/decisions/export` | Export decision history as JSONL for ML training | Yes (Admin) |

## AI System Status

The AI status endpoint tracks provider availability and daily API budget usage.

Example Response (**GET `/api/ai/status`**):
```json
{
  "enabled": true,
  "provider": "groq",
  "model": "llama3-70b-8192",
  "daily_budget": 5.0,
  "spent_today": 0.45,
  "remaining": 4.55,
  "calls_today": 125,
  "signal_weight": 0.3
}
```

:::info
The `signal_weight` defines how much influence AI confidence has on the final weighted signal probability compared to core strategy indicators.
:::

## Toggling AI Signals

AI signal enhancement can be toggled on or off without restarting the bot.

**POST `/api/ai/toggle`**

Example Response:
```json
{
  "enabled": false
}
```

## Decision Logging

Every time the AI ensemble analyzes a signal, its reasoning, confidence, and subsequent trade outcome are logged.

Example Response (**GET `/api/decisions`**):
```json
{
  "items": [
    {
      "id": 105,
      "strategy": "btc_oracle",
      "market_ticker": "btc-5m-2026-04-13-10-30",
      "decision": "APPROVE",
      "confidence": 0.85,
      "reason": "Technical momentum confirmed by sentiment analysis",
      "outcome": "win",
      "created_at": "2026-04-13T10:25:00Z",
      "signal_data": {
        "rsi": 42.5,
        "sentiment_score": 0.78,
        "volume_24h": 2500000.0
      }
    }
  ],
  "total": 450
}
```

## Decision Details

Individual decision records include the full signal context evaluated by the AI models.

**GET `/api/decisions/{id}`**

Example Response:
```json
{
  "id": 105,
  "strategy": "btc_oracle",
  "market_ticker": "btc-5m-2026-04-13-10-30",
  "decision": "APPROVE",
  "confidence": 0.85,
  "signal_data": {
    "rsi": 42.5,
    "sentiment_score": 0.78,
    "volume_24h": 2500000.0,
    "price_velocity": 0.002
  },
  "reason": "Strong bullish divergence on 1m chart coupled with high volume at support level.",
  "outcome": "win",
  "created_at": "2026-04-13T10:25:00Z"
}
```

## Exporting for Training

Decision history can be exported as an NDJSON stream for further model training and performance analysis.

**GET `/api/decisions/export`**

Query Parameters:
- `format` (string, default "jsonl"): Format of the exported data
- `strategy` (string, optional): Filter by strategy name
- `limit` (integer, default 10000): Maximum records to export

Example Line Output:
```json
{"id": 105, "strategy": "btc_oracle", "market_ticker": "btc-5m-2026-04-13-10-30", "decision": "APPROVE", "confidence": 0.85, "reason": "Bullish momentum...", "outcome": "win", "created_at": "2026-04-13T10:25:00Z"}
```
