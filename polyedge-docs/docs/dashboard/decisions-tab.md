---
sidebar_position: 6
---

# Decisions Tab

The Decisions tab is the ultimate destination for understanding the bot's logic and decision-making process. It provides a detailed log of all actions taken by the bot, including AI analysis, confidence levels, and the reasoning behind each trade.

## What You'll See

This tab is organized into:
1. **Filter Row**: Controls to narrow down decisions by strategy and decision type.
2. **Decision Log Table**: A detailed history of all bot actions (up to 100).

## Filters

| Filter | Options | Description |
|--------|---------|-------------|
| **Strategy** | Dropdown | Filter decisions made by a specific trading strategy. |
| **Decision** | All, BUY, SKIP, SELL, HOLD | Filter by the specific action taken by the bot. |

## Understanding the Data

### Decision Columns

| Column | Description |
|--------|-------------|
| **Time** | The timestamp when the decision was made. |
| **Strategy** | The name of the trading strategy that initiated the decision. |
| **Market** | The specific ticker or event the decision was about. |
| **Decision** | The action taken by the bot (e.g., `BUY`, `SKIP`, `SELL`, `HOLD`). |
| **Conf** | The bot's certainty level (0-100%) in the decision. |
| **Reason** | The detailed reasoning behind the decision, often including AI-generated insights. |

## Tips

:::tip
Read the **Reason** column to understand why the bot chose to `BUY` or `SKIP` a specific signal.
:::

:::info
The decision log automatically refreshes every 20 seconds to provide the most current insights into the bot's behavior.
:::

:::warning
Decisions marked as `SKIP` represent signals that were evaluated but did not meet the bot's execution criteria.
:::
