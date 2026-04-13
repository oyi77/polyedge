---
sidebar_position: 3
---

# Signals Tab

The Signals tab is the central hub for identifying potential trading opportunities. It aggregates data from multiple sources, including AI analysis, weather forecasts, and historical whale activity.

## What You'll See

This tab is organized into:
1. **Filter Row**: Controls to narrow down signals by type, direction, and execution status.
2. **Signals Table**: Detailed list of current and historical signals (up to 200).

## Filters

| Filter | Options | Description |
|--------|---------|-------------|
| **Type** | All, BTC, Weather, Copy, AI | Filter by the source of the trading signal. |
| **Direction** | All, Up, Down, Yes, No | Filter by the predicted outcome. |
| **Execution** | All, Executed, Skipped | Filter signals that were actually traded vs. those that were not. |

## Understanding the Data

### Signal Columns

| Column | Description |
|--------|-------------|
| **Time** | The timestamp when the signal was generated. |
| **Type Badge** | The source of the signal (e.g., `WX` for Weather, `BTC` for Bitcoin). |
| **Market** | The specific ticker or event the signal is targeting. |
| **Dir** | The predicted outcome (e.g., `UP`, `DOWN`, `YES`, `NO`). |
| **Edge%** | The calculated advantage the bot has over the current market price. |
| **Conf%** | The bot's certainty level (0-100%) in the prediction. |
| **Executed** | Whether the bot placed a trade based on this signal (`yes`/`no`). |
| **Outcome** | The result if the market has settled: `win`, `loss`, or `pending`. |

## Tips

:::tip
High **Edge%** combined with high **Conf%** indicates a premium trading opportunity.
:::

:::info
The signals feed refreshes every 30 seconds to provide the most up-to-date analysis from the bot.
:::

:::warning
A signal does not always result in a trade. The bot may skip a signal if it doesn't meet risk management criteria or if the required edge is not reached.
:::
