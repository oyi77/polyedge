---
sidebar_position: 1
---

# Environment Variables

This document provides a complete reference for all environment variables used by PolyEdge. These variables can be set in a `.env` file at the project root or passed via shell environment.

## Core Settings

| Variable | Description | Default | Required |
| --- | --- | --- | --- |
| `TRADING_MODE` | System operating mode: `paper`, `testnet`, or `live`. | `paper` | No |
| `DATABASE_URL` | SQLAlchemy connection string for the primary database. | `sqlite:///./tradingbot.db` | No |
| `INITIAL_BANKROLL` | Starting balance in USD for paper trading and Kelly sizing. | `100.0` | No |
| `SIGNAL_APPROVAL_MODE` | Workflow for signals: `manual`, `auto_approve`, or `auto_deny`. | `manual` | No |
| `ADMIN_API_KEY` | Secret key for accessing administrative API endpoints. | `None` | No |

## API Credentials

:::danger
Never share or commit your private keys or API secrets. These values grant full access to your funds and trading accounts.
:::

| Variable | Description | Default | Required |
| --- | --- | --- | --- |
| `POLYMARKET_PRIVATE_KEY` | Hex-prefixed Ethereum private key for Polymarket. | `None` | Yes (Live) |
| `POLYMARKET_API_KEY` | Optional: Pre-derived API key for Polymarket CLOB. | `None` | No |
| `POLYMARKET_API_SECRET` | Optional: Pre-derived API secret for Polymarket CLOB. | `None` | No |
| `POLYMARKET_API_PASSPHRASE` | Optional: Pre-derived API passphrase for Polymarket CLOB. | `None` | No |
| `KALSHI_API_KEY_ID` | API Key ID for Kalshi trading. | `None` | No |
| `KALSHI_PRIVATE_KEY_PATH` | File path to your Kalshi RSA private key PEM. | `None` | No |

## AI Configuration

| Variable | Description | Default | Required |
| --- | --- | --- | --- |
| `AI_PROVIDER` | AI backend selection: `groq`, `claude`, `omniroute`, or `custom`. | `groq` | No |
| `GROQ_API_KEY` | API key for Groq Cloud. | `None` | Yes (AI) |
| `GROQ_MODEL` | LLM model to use with Groq. | `llama-3.1-8b-instant` | No |
| `ANTHROPIC_API_KEY` | API key for Anthropic Claude. | `None` | No |
| `ANTHROPIC_MODEL` | LLM model to use with Anthropic. | `claude-sonnet-4-20250514` | No |
| `AI_DAILY_BUDGET_USD` | Hard cap on daily LLM token spend. | `1.0` | No |

## Strategy Settings

### BTC Trading

| Variable | Description | Default | Required |
| --- | --- | --- | --- |
| `SCAN_INTERVAL_SECONDS` | Frequency of BTC market scans. | `60` | No |
| `MIN_EDGE_THRESHOLD` | Minimum calculated edge required to generate a signal. | `0.05` | No |
| `MAX_ENTRY_PRICE` | Maximum price (0.01 to 0.99) allowed for entries. | `0.80` | No |
| `MAX_TRADE_SIZE` | Maximum USD amount allocated to a single BTC trade. | `8.0` | No |

### Weather Trading

| Variable | Description | Default | Required |
| --- | --- | --- | --- |
| `WEATHER_SCAN_INTERVAL_SECONDS` | Frequency of weather market scans. | `300` | No |
| `WEATHER_MIN_EDGE_THRESHOLD` | Minimum edge required for weather signals. | `0.10` | No |
| `WEATHER_CITIES` | Comma-separated list of city identifiers to track. | `nyc,chicago,...` | No |

## Notifications

| Variable | Description | Default | Required |
| --- | --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | Token from @BotFather for Telegram alerts. | `None` | No |
| `TELEGRAM_ADMIN_CHAT_IDS` | Comma-separated list of numeric Telegram chat IDs. | `""` | No |
