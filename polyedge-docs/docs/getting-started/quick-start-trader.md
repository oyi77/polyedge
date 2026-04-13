---
sidebar_position: 2
title: Quick Start (Trader)
description: A non-technical guide to running the PolyEdge trading bot.
---

# Quick Start (Trader)

This guide is for non-technical users who want to run the bot quickly using Docker. No programming experience is needed.

## Prerequisites

*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed on your computer.
*   A Polymarket account (if you want to trade with real money later).
*   A free [Groq API key](https://console.groq.com/keys) for AI-powered signal analysis.

## Step-by-Step Setup

### 1. Clone the Repository

Download the PolyEdge project to your computer.

```bash
git clone https://github.com/your-repo/polyedge.git
cd polyedge
```

### 2. Configure Settings

Create a settings file by copying the template.

```bash
cp .env.example .env
```

Open the `.env` file in a text editor (like Notepad or TextEdit) and add your `GROQ_API_KEY`. For now, leave `TRADING_MODE=paper` to test with fake money.

### 3. Start the Bot

Use Docker to start the backend services.

```bash
docker-compose up -d
```

:::tip
This will start both the trading engine and the database. The first time you run this, it may take a few minutes to download the necessary files.
:::

### 4. Access the Dashboard

Once the services are running, open your web browser and go to:

`http://localhost:8000`

### 5. Start Trading

You should now see the PolyEdge dashboard.

1.  **Check Connection**: Look for a green "Connected" indicator at the top.
2.  **Enable Strategies**: Go to the **Admin** tab and click on **Strategies**. Turn on "BTC Oracle" or "Weather EMOS."
3.  **Wait for Signals**: Return to the **Overview** tab. Within a few minutes, you should see trading opportunities (signals) appear.
4.  **Place Your First Trade**: Click "Simulate" on a signal to see how the bot would execute the trade in paper mode.

## What You'll See

When you first open the dashboard, you'll see a **Top Stats Bar** with these key numbers:

*   **Mode**: Should say `PAPER` (safe testing mode).
*   **Equity**: Your total value (starts at $1,000 in paper mode).
*   **P&L**: Your current profit or loss.
*   **Win Rate**: Percentage of your trades that have made money.

:::warning
Always start in **Shadow Mode** (`TRADING_MODE=paper`). Do not switch to `live` until you are comfortable with how the bot makes decisions.
:::

## Next Steps

For a detailed explanation of every tab and setting in the dashboard, see the [Dashboard Guide](../dashboard/overview-tab).
