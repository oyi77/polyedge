---
sidebar_position: 3
---

# Job Queue Architecture

PolyEdge uses a durable job queue system to manage background operations and ensure trade execution consistency across process restarts.

## Two-Phase Design

To minimize infrastructure requirements while providing a path to high-performance scaling, PolyEdge implements a two-phase architecture:

### Phase 1: SQLite-backed
- Uses an asynchronous SQLite implementation (`AsyncSQLiteQueue`).
- Zero extra infrastructure required.
- WAL (Write-Ahead Logging) mode for concurrent access.
- Ideal for development and single-server production deployments.

### Phase 2: Redis-backed
- Uses `arq`, a thin async-native wrapper for Redis.
- Drop-in replacement via the `AbstractQueue` interface.
- Enabled by setting the `JOB_QUEUE_URL` environment variable.
- Provides superior concurrency and horizontal scaling capabilities.

## Job Types

The queue manages several critical system operations:
- **Strategy Execution**: Triggers trading strategies on schedules.
- **Trade Settlement**: Monitors and settles completed trades.
- **Calibration**: Regularly updates Brier scores and signal accuracy metrics.
- **Maintenance**: Background data cleanup and system health tasks.

## Job Scheduling

PolyEdge uses APScheduler as the primary job scheduler. It handles recurring tasks like market scans and settlement checks. When a task is triggered, it is pushed to the job queue for execution by an available worker.

## Worker Configuration

Workers run in separate processes to prevent blocking the main API server.
- **Idempotency**: Jobs are enforced with unique constraints to prevent duplicate execution of the same work.
- **Timeouts**: Configurable execution limits ensure workers remain responsive.
- **Retries**: Jobs that fail are automatically retried with configurable backoff policies.

## Queue Metrics

Real-time queue health is tracked and exposed:
- Queue depth (number of pending jobs).
- Latency (p50/p95/p99 execution times).
- Job success and failure rates.
- Worker utilization.
