# ADR-001: Job Queue Architecture (SQLite-First)

**Status:** Accepted
**Date:** 2026-04-07
**Deciders:** PolyEdge core team

## Context (Decision Drivers)
- APScheduler stores jobs in memory; a process crash loses all scheduled work.
- PolyEdge runs market scans and trade settlement on tight schedules; missing a job means missing trades or stale settlements.
- We need durable, restart-safe job execution without adding heavy infrastructure dependencies on day one.
- Production target is a single-VPS or single-pod deployment for the first 90 days.

## Decision
Implement a two-phase job queue:
- **Phase 1 (SQLite-backed):** AsyncSQLiteQueue + Worker loop. Zero new infra. WAL mode for concurrency. Default opt-in via `JOB_WORKER_ENABLED`.
- **Phase 2 (Redis + arq):** Drop-in via the AbstractQueue interface. Switch by setting `JOB_QUEUE_URL=redis://...`. Migration tool `migrate_to_redis.py` drains SQLite into Redis.

## Alternatives Considered
1. **APScheduler with a JobStore (SQLAlchemyJobStore):** Half-step. Job triggers are persisted but in-flight jobs still die mid-execution and APScheduler's lifecycle hooks are awkward to extend with timeouts and idempotency.
2. **Celery + Redis from day one:** Heavier ops burden, requires a broker process, larger cognitive load. Overkill for current scale.
3. **Pure arq from day one:** Forces Redis dependency before we know the queue shape; hard to develop offline.
4. **PostgreSQL LISTEN/NOTIFY queue:** Requires Postgres in dev. Phase 1 uses SQLite.

## Why Chosen
- **SQLite-first** lets us ship the queue with zero extra infra. Developers run `python run.py` and get a real persistent queue.
- **AbstractQueue interface** isolates the backend so Phase 2 is a configuration change, not a rewrite.
- **arq for Phase 2** is a thin async-native wrapper around Redis with built-in concurrency and timeout semantics — closest to our existing Worker model.

## Consequences
### Positive
- Crash recovery: jobs persist across process restarts.
- Idempotency: `(job_type, idempotency_key)` unique constraint prevents duplicate work.
- Observability: queue depth, latency p50/p95/p99, timeout rate via `backend/monitoring/queue_metrics.py`.
- Simple ops on day one; clear upgrade path to Redis without code changes in handlers.

### Negative
- SQLite WAL has limited write concurrency vs. Redis.
- At-least-once delivery (jobs can run twice if a worker crashes mid-processing). Handlers must be idempotent.
- Two backends to maintain in test (SQLite path is the default; Redis is gated behind skipif fixtures).

## Follow-Ups
- Promote queue depth and latency metrics into the existing Telegram /status report.
- Wire `migrate_to_redis.py` into the deployment runbook once a Redis instance is provisioned.
- Revisit retry policy: exponential backoff is currently linear (retry_count++). Consider arq's exponential backoff in Phase 2.
- Decide on dead-letter handling for jobs that exceed `max_retries`.
