---
sidebar_position: 4
title: Docker Setup
description: How to deploy PolyEdge with Docker Compose.
---

# Docker Setup

Docker is the easiest way to deploy PolyEdge consistently across different environments. The provided `docker-compose.yml` file defines all the necessary services and their connections.

## Services Defined

PolyEdge consists of two main services:

| Service | Container Name | Port | Description |
|---------|----------------|------|-------------|
| **Backend** | `backend` | 8000 | FastAPI application server. |
| **Frontend** | `frontend` | 80 | React application served via Nginx. |

## Quick Start with Docker

Starting the entire stack requires only a single command:

```bash
docker-compose up -d
```

:::tip
The `-d` flag runs the containers in the background. To see the logs, run `docker-compose logs -f`.
:::

## Environment Variables

Docker Compose uses the `.env` file to configure the services. Ensure you have copied `.env.example` to `.env` and filled in the required values.

### Database Volume

The backend service uses a Docker volume to persist the SQLite database:

```yaml
volumes:
  - ./tradingbot.db:/app/tradingbot.db
```

This ensures your trade history and settings are not lost when the containers are stopped or updated.

## Health Checks

The backend service includes a built-in health check to ensure it's fully started before other services depend on it:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

The frontend service will wait for this health check to pass before it starts.

## Using External Redis

By default, PolyEdge uses a local SQLite database for the job queue. If you want to use an external Redis instance, update your `.env` file:

```bash
# Update this in your .env
JOB_QUEUE_URL=redis://your-redis-host:6379/0
```

## Production Considerations

When deploying PolyEdge to a production server, consider the following:

*   **Security**: Ensure your `.env` file is protected and not checked into version control.
*   **Networking**: In production, the frontend usually runs on port 80/443. The backend should be behind a reverse proxy like Nginx or Caddy.
*   **Restarts**: The `restart: unless-stopped` policy ensures PolyEdge starts automatically if the server reboots.
*   **Logs**: Monitor your container logs regularly to check for trading errors or connectivity issues.

```bash
# View logs for a specific service
docker-compose logs -f backend
```

:::warning
Never run live trading in a containerized environment without first verifying connectivity in `TRADING_MODE=paper`.
:::
