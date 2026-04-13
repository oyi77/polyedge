---
sidebar_position: 4
---

# Deployment

PolyEdge supports several deployment methods, ranging from containerized local environments to cloud platforms.

## Docker Compose

The `docker-compose.yml` file defines a multi-service setup for running the application and its dependencies.

- **Backend**: Python FastAPI application running the trading engine and API server.
- **Frontend**: React application served via a static build or Vite preview.
- **Redis (Optional)**: If configured, provides a high-performance job queue backend.

### Standard Ports
- **8000**: Backend API server.
- **80**: Frontend dashboard.
- **6379**: Redis (if enabled).

## Cloud Platforms

### Railway (Backend)
The backend is configured for deployment on Railway using `railway.json`.
- Uses the **NIXPACKS** builder.
- Automatic Python buildpack detection.
- Start command: `python run.py`.
- Health check: `/api/health`.

### Vercel (Frontend)
The React dashboard can be deployed to Vercel via `vercel.json`.
- Configured as a static build (`@vercel/static-build`).
- Root source: `frontend/package.json`.
- Build output: `dist/`.

## PM2 Process Management

For production deployments on VPS or bare metal, `ecosystem.config.js` manages system processes.

- **polyedge-api**: The FastAPI backend server.
- **polyedge-bot**: The core orchestrator and trading engine.
- **polyedge-frontend**: Serves the React dashboard.

PM2 handles automatic restarts, log rotation, and application lifecycle management.

## Environment Variables

Configuration is managed through environment variables. A template is provided in `.env.example`.

### Core Settings
- `TRADING_MODE`: `paper` or `live`.
- `SHADOW_MODE`: Set to `true` for paper trading logic.
- `DATABASE_URL`: Connection string for the database (default: `sqlite:///./tradingbot.db`).
- `REDIS_URL`: Optional connection string for the job queue.
- `JOB_WORKER_ENABLED`: Enable the background job queue.

### API Credentials
Credentials for Polymarket (CLOB API), Kalshi (RSA keys), and AI providers (Anthropic, Groq) must be configured for the system to function correctly.
