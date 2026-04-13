---
sidebar_position: 5
---

# Project Structure

PolyEdge is organized into backend and frontend directories, separating core trading logic from monitoring and administration.

## Directory Tree

```text
polyedge/
├── backend/
│   ├── api/            # FastAPI routes and middleware
│   ├── core/           # Orchestration, risk, scheduling, and signal logic
│   ├── data/           # Market data clients and integration
│   ├── models/         # SQLAlchemy database models
│   ├── strategies/     # Individual trading strategy implementations
│   ├── ai/             # AI ensemble and signal providers
│   ├── bot/            # Telegram and Discord notification routers
│   ├── queue/          # Job queue (Redis and SQLite implementations)
│   └── tests/          # Pytest backend test suite
├── frontend/
│   ├── src/            # React source code
│   │   ├── components/ # Reusable UI components
│   │   ├── hooks/      # TanStack Query and state management hooks
│   │   └── pages/      # Page-level dashboard and admin views
│   ├── e2e/            # Playwright end-to-end tests
│   └── vite.config.ts  # Vite build configuration
├── docs/               # System and architecture documentation
├── main.py             # Main entry point (API server and workers)
├── run.py              # Environment-validated runner
└── docker-compose.yml  # Multi-service container orchestration
```

## Top-Level Directories

### Backend
The heart of the trading bot, written in Python. It contains the API layer, core trading engine, market data clients, and strategy implementations.

### Frontend
A React dashboard for monitoring signals, trades, and portfolio performance. It also provides administrative controls for managing the bot's configuration.

### Docs
Documentation for the system, including API references, architecture decision records (ADRs), and setup guides.

## Key Files

| File | Purpose |
|------|---------|
| `main.py` | Starts the FastAPI server and background processes. |
| `backend/api/main.py` | Configures FastAPI, CORS, and registers all sub-routers. |
| `backend/core/orchestrator.py` | Coordinates the execution of registered strategies. |
| `backend/core/risk_manager.py` | Validates trades against position and portfolio risk limits. |
| `backend/strategies/base.py` | Base class and context for implementing trading strategies. |
| `backend/config.py` | Central configuration file for all system settings. |
| `frontend/src/api.ts` | Frontend client for communicating with the backend API. |

## Module Dependency Overview

The system is designed with a layered architecture:
- **API** depends on **Core** and **Models**.
- **Core** depends on **Data**, **Strategies**, **AI**, and **Risk Manager**.
- **Strategies** inherit from a base class in **Core** and use **Data** and **AI** for signal generation.
- **Data** clients are isolated, providing a consistent interface for market and external information.
- **Models** are used across the backend for persistence and data transfer.
