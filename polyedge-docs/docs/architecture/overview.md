---
sidebar_position: 1
---

# Architecture Overview

PolyEdge is a full-stack automated prediction market trading bot designed for Polymarket and Kalshi. It integrates AI-powered signal generation, multi-strategy execution, and real-time market data aggregation.

## System Diagram

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
│  │CLOB SDK  │ │REST API  │ │Kraken/   │ │GFS       │ │            │ │
│  │+ WebSocket│ │         │ │Binance   │ │Ensemble  │ │            │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE: SQLite DB │ Redis Queue │ APScheduler │ Prometheus  │
└──────────────────────────────────────────────────────────────────────┘
```

## Core Components

### Frontend
A React 18 dashboard built with TypeScript and Vite. It uses TanStack Query for data synchronization and Tailwind CSS for styling. The UI provides real-time monitoring of signals, trades, and portfolio performance, along with administrative controls for bot management.

### Backend
A FastAPI application written in Python. It manages the trading lifecycle, including signal generation, risk assessment, and order execution. The backend is modular, separating API routes from core trading logic and data ingestion.

### Data Sources
PolyEdge aggregates data from multiple providers:
- Market platforms: Polymarket (CLOB SDK) and Kalshi (REST API).
- Price data: 1-minute candles from Coinbase, Kraken, and Binance.
- Weather data: GFS ensemble forecasts from Open-Meteo and observations from the NWS API.

### Infrastructure
- Database: SQLite for primary persistence, with SQLAlchemy ORM for portability.
- Job Queue: A persistent queue system with Redis as the preferred backend and SQLite as a zero-infrastructure fallback.
- Scheduler: APScheduler handles recurring tasks like market scans and settlement checks.
- Monitoring: Prometheus metrics are exposed via a `/metrics` endpoint.

## Tech Stack Summary

| Layer | Technologies |
|-------|--------------|
| Frontend | React 18, TypeScript, Vite, TanStack Query, Tailwind CSS, Lucide React, Recharts |
| Backend | Python 3.10+, FastAPI, Pydantic, SQLAlchemy, APScheduler |
| AI | Anthropic Claude, Groq (Llama), Ensemble Logic |
| Data | py-clob-client, Kalshi SDK, HTTP/WebSocket Clients |
| Storage | SQLite, Redis (Optional) |
| DevOps | Docker, PM2, GitHub Actions |
