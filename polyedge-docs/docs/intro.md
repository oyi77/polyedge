---
sidebar_position: 1
slug: /intro
title: Introduction
description: Welcome to PolyEdge, an AI-powered prediction market trading bot.
---

# Introduction

Welcome to **PolyEdge**, a full-stack automated prediction market trading bot targeting **Polymarket** and **Kalshi**. 

PolyEdge combines real-time market data aggregation with AI-powered signal generation to identify and execute profitable trades across diverse categories. Whether you are interested in weather events, Bitcoin price movements, or whale trader movements, PolyEdge provides the infrastructure to automate your edge.

## Choose Your Path

How you use PolyEdge depends on your background and goals:

*   **I'm a Trader**: You want to get the bot running quickly to start trading. You're comfortable with basic terminal commands and Docker.
    *   [Go to Quick Start for Traders](./getting-started/quick-start-trader)
*   **I'm a Developer**: You want to explore the codebase, run from source, or contribute. You're familiar with Python, React, and FastAPI.
    *   [Go to Quick Start for Developers](./getting-started/quick-start-developer)

## Core Features

*   **9 Trading Strategies**: Parallel execution of diverse strategies including BTC Momentum, Weather EMOS, and Copy Trading.
*   **AI Signal Synthesis**: Uses Claude and Groq LLMs for sentiment analysis and decision reasoning.
*   **Shadow Mode**: Full paper trading support to test your strategies without risking real capital.
*   **Real-time Dashboard**: A React-based interface for monitoring trades, signals, and portfolio performance.
*   **Risk Management**: Built-in circuit breakers, Kelly Criterion sizing, and position limits.

## Architecture

PolyEdge is built with a modular architecture to ensure reliability and performance:

```text
┌──────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                    │
│  React 18 + TypeScript + TanStack Query + Tailwind + Vite            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │Dashboard │ │ Admin    │ │ Signals  │ │  Trades  │ │ GlobeView │  │
│  │Overview  │ │ Controls │ │  Table   │ │  Table   │ │  (3D Map) │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
└──────────────────────────────────────────────────────────────────────┘
                               │ REST API
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI + Python)                         │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────────────┐ │
│  │Orchestrator│ │  9 Trading│ │   Risk    │ │ AI Ensemble           │ │
│  │           │ │ Strategies│ │  Manager  │ │ (Claude + Groq)       │ │
│  └───────────┘ └───────────┘ └───────────┘ └───────────────────────┘ │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────────────┐ │
│  │  Order    │ │Settlement │ │  Signal   │ │ Job Queue             │ │
│  │ Executor  │ │  Engine   │ │Calibration│ │ (Redis / SQLite)      │ │
│  └───────────┘ └───────────┘ └───────────┘ └───────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        DATA SOURCES                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │Polymarket│ │ Kalshi   │ │Coinbase/ │ │Open-Meteo│ │  NWS API   │ │
│  │CLOB SDK  │ │REST API  │ │Kraken/   │ │Binance   │ │            │ │
│  │+ WebSocket│ │         │ │Binance   │ │Ensemble  │ │            │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE: SQLite DB │ Redis Queue │ APScheduler │ Prometheus  │
│  DEPLOY: Docker Compose │ Railway (backend) │ Vercel (frontend)     │
│  NOTIFY: Telegram │ Discord                                          │
└──────────────────────────────────────────────────────────────────────┘
```
