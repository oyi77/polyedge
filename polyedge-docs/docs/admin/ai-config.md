---
sidebar_position: 10
---

# AI Configuration

The AI tab provides a comprehensive interface for configuring and monitoring the bot's AI-enhanced signal pipeline. It allows you to select and manage AI providers, set model parameters, and analyze system performance for automated parameter adjustments.

## Access
Access to the AI tab requires admin login. The AI configuration is stored in the system's `ADMIN_SETTINGS` JSON and hot-reloaded when saved.

## AI Master Toggle
The top header indicates if the AI-enhanced signal pipeline is **Enabled** (Green) or **Disabled** (Gray):
- **AI-Enhanced Signals**: A master toggle to turn the AI signal pipeline on or off.
- **AI Status**: A real-time overview of the AI's current state and usage statistics.

## AI Status Metrics
When the AI-enhanced signal pipeline is enabled, the status section displays key metrics:

| Field | Description |
|-------|-------------|
| **Provider** | The currently active AI model provider (e.g., `Groq`, `Claude`, `OmniRoute`). |
| **Calls Today** | The total number of AI API calls made by the bot today. |
| **Spent** | The total cost incurred by the bot for AI API calls today. |
| **Signal Weight** | The relative importance of AI analysis vs. technical indicators (e.g., `30% AI / 70% technical`). |
| **Daily Budget** | The current AI budget usage as a percentage of the total daily limit. |

:::tip
Budget percentages are color-coded: **Green** for normal usage, **Amber** for over 50%, and **Red** for over 80%.
:::

## AI Provider Configuration
The **AI Provider** section allows you to manually configure the bot's AI model provider:
- **Provider**: A dropdown menu to select the provider (e.g., `Groq`, `Claude`, `OmniRoute`, `Custom`).
- **API URL**: The base URL for the selected provider's API.
- **API Key**: The sensitive API key for the selected provider's API (masked for security).
- **Model**: The specific model name to use (e.g., `llama-3.1-70b-versatile`).
- **Daily Budget ($)**: The daily spending limit for AI API calls.
- **Signal Weight (0.0 - 0.5)**: The relative weight of AI analysis in the signal generation process.

## AI Risk Analysis
The **AI Risk Analysis** section provides a summary of the bot's performance and AI-suggested parameter adjustments:
- **Analyze Performance**: Triggers an AI-powered analysis of the bot's recent trading performance.
- **AI Suggestions**: A table of AI-suggested parameter adjustments based on the analysis.
- **Apply Suggestions**: Commits the AI-suggested parameter adjustments to the system settings.

:::warning
AI suggestions are based on the bot's recent performance and may involve risk. Review all suggested adjustments carefully before applying them.
:::

## How It Works
The AI tab interacts with the `/api/ai/status`, `/api/ai/suggest`, and `/api/admin/settings` endpoints for all operations.
- **Signal Enhancement**: When the AI-enhanced signal pipeline is enabled, the bot sends each signal to the active AI provider for probability estimation.
- **Budget Control**: The bot monitors its daily spending and automatically disables AI calls if the daily budget is exceeded.
- **Weighting**: The bot combines the AI-generated probability with technical indicators based on the configured signal weight.

:::tip
Use the **AI** tab to test different AI providers and models for optimal signal accuracy and cost-effectiveness.
:::
