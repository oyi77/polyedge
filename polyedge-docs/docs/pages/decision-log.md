---
sidebar_position: 5
---

# Decision Log

The Decision Log is a comprehensive historical record of every trade decision the PolyEdge bot has made. It provides the reasoning behind each BUY, SKIP, SELL, and HOLD action, along with the data used to reach that conclusion.

**Route Path:** `/decisions`

## Layout

The Decision Log is a single-column dashboard with two primary views:

- **Decision Table**: A list of all decisions with key details like strategy name, market ticker, decision type, and confidence percentage.
- **Detail Modal**: An overlay that opens when a specific decision is selected, providing the full rationale and a JSON representation of the signal data.

## Features

- **Decision Reasoning**: Every action the bot takes (including skips) is recorded with a human-readable "Reason" field, such as RSI being overbought or a high-confidence whale trade detected.
- **Confidence Scoring**: Each decision is accompanied by a percentage (0-100%) indicating the bot's certainty in its analysis.
- **Outcome Tracking**: Decisions are eventually updated with their actual market outcome (WIN, LOSS, or PUSH) once the associated trade has settled.
- **Search and Filter**: Filter the decision log by strategy, decision type (BUY/SELL/SKIP), market ticker, or date range.
- **JSONL Export**: Export the entire decision log as a JSONL file, suitable for ML model training or deep backtest analysis.

## Data Sources

The Decision Log is powered by the following API and data:

- **Decisions API**: `fetchDecisions` (every 30s) providing the paginated list of trade actions.
- **Decision Detail API**: `fetchDecision` (on demand) for the deep-dive analysis of a single log entry.
- **Signal Data**: The JSON signal data contains the raw inputs (e.g., RSI values, VWAP price, weather ensemble data) at the exact moment the decision was made.

:::tip
Review the "SKIP" decisions to understand why the bot passed on a potential opportunity. This is often just as valuable as analyzing winning trades.
:::
