---
sidebar_position: 1
title: Overview
description: Understand prediction markets and the PolyEdge trading approach.
---

# Overview

PolyEdge provides an automated way to interact with prediction markets. These markets are platforms where people trade on the outcomes of real-world events. Instead of buying shares in a company, you buy "shares" in a question.

## What are Prediction Markets?

Think of prediction markets as collective forecasting tools. Participants buy and sell contracts that pay out $1.00 if a specific event occurs and $0.00 if it does not.

*   If a "YES" share is trading at 60 cents, the market consensus is that there's a 60% chance the event will happen.
*   If you believe the real probability is 80%, you have an "edge" and a reason to trade.

PolyEdge automates this process by gathering data, calculating its own probabilities, and comparing them to market prices to find opportunities.

## Trading Modes

PolyEdge supports three distinct modes to manage your risk:

| Mode | Real Money? | Description |
|------|-------------|-------------|
| **Shadow (Paper)** | No | Trades are simulated using a virtual bankroll. No external API credentials are required. Best for testing strategies. |
| **Testnet** | No | Uses testnet wallets and fake USDC. Requires a Polygon private key. Useful for verifying integration without real capital. |
| **Live** | Yes | Executes real trades on Polymarket or Kalshi using your actual funds. Requires full configuration. |

## Supported Platforms

*   **Polymarket**: The leading decentralized prediction market on Polygon. PolyEdge uses the official CLOB SDK for order execution.
*   **Kalshi**: A regulated exchange for trading on event outcomes. PolyEdge integrates with the Kalshi REST API.

## Trading Strategies

The bot runs 9 parallel strategies, each looking for different types of opportunities:

| Strategy | Plain English Description |
|----------|---------------------------|
| **BTC Momentum** | Follows Bitcoin price trends using technical indicators from major crypto exchanges. |
| **BTC Oracle** | Uses multiple AI models to predict future Bitcoin price targets. |
| **Weather EMOS** | Analyzes massive weather models (GFS) to predict local temperature outcomes. |
| **Copy Trader** | Automatically mirrors positions held by the most successful "whale" traders on Polymarket. |
| **Market Maker** | Places "buy" and "sell" orders at different prices to profit from the bid-ask spread. |
| **Kalshi Arbitrage** | Finds price differences between Polymarket and Kalshi for the same event. |
| **Bond Scanner** | Identifies lower-risk opportunities that behave similarly to fixed-income investments. |
| **Whale PNL Tracker** | Monitors top traders' actual performance to validate signals. |
| **Realtime Scanner** | Detects sudden price spikes or "line moves" across all active markets. |

:::info
By default, the bot starts in **Shadow Mode** with a $1,000 virtual bankroll. This allows you to see how the strategies perform before committing real capital.
:::
