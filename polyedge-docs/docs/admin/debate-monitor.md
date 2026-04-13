---
sidebar_position: 11
---

# Debate Monitor

The Debate Monitor tab provides a real-time interface for monitoring the AI-powered debate process between different models during signal generation. It allows you to view transcripts, arguments, and consensus results for each trading decision.

## Access
Access to the Debate Monitor tab requires admin login. The AI-enhanced signal pipeline must be enabled in the AI tab for debates to be recorded and displayed here.

## Recent Debates Table
A real-time table lists all recent trading decisions that involved an AI debate:

| Column | Description |
|--------|-------------|
| **ID** | The unique identifier for the decision (e.g., `#123`). |
| **Market** | The ticker symbol or ID for the market (e.g., `BTC-100k-FRI`). |
| **Decision** | The final trade decision: **BUY** (Green), **SELL** (Red), **SKIP** (Gray). |
| **Conf %** | The consensus confidence level from the debate (0-100%). |
| **Time** | The timestamp of when the decision was made. |
| **Action** | The **View Debate Room** button (>) to open the debate transcript. |

:::tip
Clicking on a row in the table opens the **Debate Room** panel with the full transcript.
:::

## Debate Room Panel
The **Debate Room** panel displays the full transcript and arguments for the selected decision:

### Judge Synthesis
The top section highlights the final judgment and reasoning from the AI judge:
- **Judge Synthesis**: A text summary of the judge's final reasoning (e.g., "The bull arguments for a BTC price increase are stronger due to recent momentum and volume signals.").
- **Consensus Prob**: The final consensus probability for the outcome (0-100%).
- **Confidence**: The judge's confidence in the final decision (0-100%).

### Debate Rounds
The middle section displays the specific arguments from the bull and bear AI models:
- **Bull Arguments**: A list of arguments for a "Yes" outcome, categorized by round.
- **Bear Arguments**: A list of arguments for a "No" outcome, categorized by round.

:::tip
Each argument includes its specific probability estimate for the outcome.
:::

### Data Sources
The bottom section lists the external data sources and research materials used during the debate:
- **Data Sources**: A list of URLs, news articles, and market data providers referenced by the AI models.

## How It Works
The Debate Monitor tab interacts with the `/api/decisions` and `/api/decisions/{id}` endpoints for all operations.
- **Ensemble Analysis**: When a signal is generated, the bot initiates a multi-round debate between different AI models (e.g., Claude vs. Groq).
- **Judge Selection**: A third "judge" model (e.g., Claude 3.5 Sonnet) synthesizes the arguments and provides a final consensus probability and confidence.
- **Transcript Storage**: The full transcript and data sources are stored in the system database for historical review and audit.

:::warning
Debates are only recorded for strategies that use the `AIOrchestrator` (e.g., `general_scanner`).
:::

:::tip
Use the **Debate Monitor** tab to gain deep insights into the bot's reasoning and the quality of its AI-driven decisions.
:::
