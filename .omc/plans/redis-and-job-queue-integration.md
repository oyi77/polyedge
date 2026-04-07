# Redis and Job Queue Integration Plan

**Status:** Approved via Consensus Planning (3 iterations)
**Created:** 2026-04-07
**Revision:** 3 (FINAL - All Critic Feedback Addressed)
**Scope:** Phase 1 + Phase 2 (Full Implementation)

---

## Executive Summary

Add Redis caching and background job queue to PolyEdge trading bot to solve critical scheduler vulnerability where jobs are lost on process crashes.

**Two-Phase Approach:**
- **Phase 1:** SQLite-backed job queue with cache abstraction (8 hours)
- **Phase 2:** Redis + arq integration (6 hours, triggered if queue latency >5s)

**Total Effort:** 14 hours

---

## Decision: SQLite-First with Thread Pool Executor

### Architecture Decisions

1. **Sync SQLAlchemy + ThreadPoolExecutor** — Matches existing 40+ `SessionLocal()` patterns
2. **Custom AsyncSQLiteQueue** — Thread pool for sync DB operations in async context
3. **AbstractCache/AbstractQueue** — Enables seamless SQLite → Redis migration
4. **Job timeout mechanism** — `asyncio.wait_for()` with `JOB_TIMEOUT_SECONDS` (300s default)
5. **APScheduler coexistence clarified** — Explicit trigger disable when worker starts
6. **Graceful shutdown** — In-flight job tracking with 30s wait-before-cancel
7. **WAL mode** — PRAGMA configuration for concurrent access

### Why Not Redis-First?

- **RQ is synchronous** — Incompatible with asyncio app (creates new event loop per job)
- **aiosqlite not in requirements** — Would require migrating 40+ database calls
- **Operational complexity** — Redis deployment/monitoring overhead
- **YAGNI principle** — Defer until metrics show actual need (queue latency >5s)

---

## Implementation Steps

### Phase 1: SQLite Job Queue (8 hours)

#### Step 1: Database Models (1.5 hours)
**Files:**
- `backend/models/database.py` — Add `JobQueue` table

**Schema:**
```python
class JobQueue(Base):
    __tablename__ = "job_queue"
    
    id = Column(Integer, primary_key=True)
    job_type = Column(String(50), nullable=False)
    idempotency_key = Column(String(255), nullable=True)
    priority = Column(String(20), default="medium")
    status = Column(String(20), default="pending")
    payload = Column(JSON, nullable=False)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    scheduled_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_job_queue_status_priority', 'status', 'priority'),
        UniqueConstraint('job_type', 'idempotency_key', name='uq_job_idempotency'),
    )
```

#### Step 2: Queue Implementation (2 hours)
**Files:**
- `backend/queue/__init__.py`
- `backend/queue/sqlite_queue.py` — AsyncSQLiteQueue with thread pool
- `backend/queue/abstract.py` — AbstractQueue interface

**Key Components:**
- `_db_executor = ThreadPoolExecutor(max_workers=4)`
- `async def enqueue()` — Add job to queue
- `async def dequeue()` — Fetch next pending job
- `async def complete()` / `fail()` — Update job status
- Job timeout handling with `asyncio.wait_for()`

#### Step 3: Job Handlers (1.5 hours)
**Files:**
- `backend/queue/handlers.py` — Job execution functions

**Handlers:**
- `market_scan()` — BTC/Weather market scanning
- `settlement_check()` — Trade settlement
- `signal_generation()` — Strategy signals

#### Step 4: Worker Loop (1.5 hours)
**Files:**
- `backend/queue/worker.py` — Worker process

**Features:**
- Configurable `max_concurrent=1` 
- Graceful shutdown with in-flight job tracking
- Thread pool cleanup on shutdown
- Job timeout enforcement (300s default)

#### Step 5: Scheduler Integration (1.5 hours)
**Files:**
- `backend/core/scheduler.py` — Modify to use queue

**Changes:**
- Disable APScheduler job triggers when `JOB_WORKER_ENABLED=true`
- Enqueue jobs instead of direct execution
- Keep APScheduler as timer only

#### Step 6: Migration Script (1 hour)
**Files:**
- `backend/queue/migrate_jobs.py` — Bootstrap script

**Features:**
- Enqueue existing APScheduler jobs to persistent queue
- One-time migration on startup

#### Step 7: Testing (1 hour)
**Files:**
- `backend/tests/test_queue/test_sqlite_queue.py`
- `backend/tests/test_queue/test_worker.py`
- `backend/tests/test_queue/test_migration.py`

**Tests:**
- Job enqueue/dequeue
- Priority ordering
- Crash recovery (kill -9 test)
- Timeout handling
- Graceful shutdown

### Phase 2: Redis + arq (6 hours)

**Trigger condition:** Queue latency consistently >5s

#### Step 8: Redis Cache Implementation (2 hours)
**Files:**
- `backend/cache/redis_cache.py`
- `backend/cache/__init__.py`

**Features:**
- Connection pooling
- Circuit breaker for Redis failures
- TTL-based cache invalidation

#### Step 9: arq Integration (2 hours)
**Files:**
- `backend/queue/redis_queue.py` — arq-based implementation
- `backend/queue/arq_worker.py`

**Features:**
- Async-native Redis queue
- Job priorities
- Retry with exponential backoff

#### Step 10: Monitoring (1 hour)
**Files:**
- `backend/monitoring/queue_metrics.py`

**Metrics:**
- Queue depth
- Job latency (p50, p95, p99)
- Timeout rate
- Error rate by job type

#### Step 11: Migration (1 hour)
**Files:**
- `backend/queue/migrate_to_redis.py`

**Features:**
- Drain SQLite queue
- Hot migration to Redis
- Rollback capability

---

## Configuration

Add to `backend/config.py`:
```python
# Job Queue Settings
JOB_WORKER_ENABLED: bool = True
JOB_QUEUE_URL: str = "sqlite:///job_queue.db"  # or "redis://localhost:6379"
JOB_TIMEOUT_SECONDS: int = 300  # 5 minutes
MAX_CONCURRENT_JOBS: int = 1
DB_EXECUTOR_MAX_WORKERS: int = 4

# Cache Settings
CACHE_URL: str = "sqlite:///cache.db"  # or "redis://localhost:6379/0"
CACHE_TTL_SECONDS: int = 300  # 5 minutes
```

---

## Acceptance Criteria

### Phase 1 (SQLite Queue)
- [ ] `JobQueue` table created with all fields and indexes
- [ ] `AsyncSQLiteQueue` implements enqueue/dequeue/complete/fail
- [ ] Worker loop processes jobs with timeout protection
- [ ] APScheduler triggers disabled when worker enabled
- [ ] Jobs survive process crash (kill -9 test passes)
- [ ] Thread pool cleanup on worker shutdown
- [ ] Graceful shutdown waits for in-flight jobs (max 30s)
- [ ] Idempotency keys prevent duplicate job execution
- [ ] WAL mode PRAGMA configured
- [ ] All tests pass (unit, integration, crash recovery)
- [ ] `JOB_TIMEOUT_SECONDS` configurable via settings

### Phase 2 (Redis + arq)
- [ ] Redis cache implements abstract interface
- [ ] arq worker processes jobs from Redis queue
- [ ] Circuit breaker handles Redis failures
- [ ] Queue latency metrics collected
- [ ] Migration from SQLite to Redis succeeds
- [ ] Rollback to SQLite works if Redis unavailable

---

## Verification Steps

### Phase 1 Verification
```bash
# 1. Database schema
cd /home/openclaw/projects/polyedge
python -c "from backend.models.database import JobQueue; print('OK')"

# 2. Queue operations
python -c "
import asyncio
from backend.queue.sqlite_queue import get_queue
async def test():
    q = await get_queue()
    await q.enqueue('test', {'data': 'test'}, priority='high')
    print('Enqueue OK')
asyncio.run(test())
"

# 3. Crash recovery test
# - Enqueue 10 jobs
# - Kill -9 after 3 complete
# - Restart
# - Verify remaining 7 jobs execute
# - Check: job_queue table shows all 10 completed

# 4. Worker timeout test
# - Create job that sleeps 400s (>300s timeout)
# - Verify job times out and is marked failed
# - Verify worker continues processing other jobs

# 5. Graceful shutdown
# - Start 5 long-running jobs
# - Send SIGTERM
# - Verify worker waits for jobs to complete (max 30s)
# - Check: thread pool properly closed

# 6. Queue status via DB query
python -c "
from backend.models.database import SessionLocal, JobQueue
db = SessionLocal()
pending = db.query(JobQueue).filter(JobQueue.status == 'pending').count()
print(f'Pending jobs: {pending}')
"

# 7. WAL mode verification
sqlite3 job_queue.db "PRAGMA journal_mode"
# Should show: wal
```

---

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Thread pool exhaustion | MEDIUM | LOW | Max 4 workers, jobs time out after 300s |
| SQLite write lock contention | LOW | MEDIUM | WAL mode enabled, single worker |
| Job timeout partial state | HIGH | LOW | Idempotency keys prevent duplicate operations |
| APScheduler double-execution | HIGH | LOW | Explicit trigger disable when worker starts |
| Worker crash during job | MEDIUM | LOW | Jobs marked pending on restart, retry logic |
| Phase 2 migration complexity | MEDIUM | LOW | Optional Phase 2, clear trigger condition |

---

## Success Criteria

**Phase 1 Complete When:**
1. ✅ All acceptance criteria verified
2. ✅ Crash recovery test passes (jobs survive kill -9)
3. ✅ Timeout test passes (hung jobs don't block worker)
4. ✅ All unit tests pass
5. ✅ Integration tests pass
6. ✅ Thread pool cleanup verified
7. ✅ APScheduler triggers disabled when worker running

**Phase 2 Complete When:**
1. ✅ Redis cache working with circuit breaker
2. ✅ arq worker processing jobs
3. ✅ Queue latency <5s (or justification for >5s)
4. ✅ Migration from SQLite to Redis successful
5. ✅ Rollback to SQLite tested

---

## Open Questions

1. Should `JOB_TIMEOUT_SECONDS` be per-job-type configurable?
2. For Phase 2: Hot-migration or cold-migration to Redis?
3. Should Phase 1 include Telegram alerts for job failures?

---

## ADR: SQLite-First Job Queue

### Decision
Implement SQLite-backed job queue with thread pool executor in Phase 1, with optional Redis upgrade in Phase 2 if metrics show need.

### Drivers
1. **Production reliability** — Jobs must survive crashes
2. **Existing patterns** — Codebase uses sync SQLAlchemy everywhere
3. **Incremental validation** — Defer Redis until proven necessary

### Alternatives Considered
- **Full Redis now (9.5h)** — Rejected: Premature optimization, adds operational complexity
- **aiosqlite migration** — Rejected: Would require refactoring 40+ database calls
- **RQ library** — Rejected: Synchronous, incompatible with asyncio
- **Keep APScheduler** — Rejected: In-memory jobs lost on crash

### Why Chosen
- Matches existing codebase patterns (sync SQLAlchemy)
- Minimal risk — familiar technology
- Clear upgrade path to Redis if needed
- 8h implementation vs 14h for full Redis

### Consequences
**Positive:**
- Jobs persist across crashes
- No new infrastructure dependencies
- Clear metrics trigger for Phase 2
- Matches existing async architecture

**Negative:**
- Thread pool overhead for DB operations
- SQLite write serialization (mitigated by WAL mode)
- Phase 2 migration required if scaling needed

### Follow-ups
- Monitor queue latency metric
- If >5s consistently, initiate Phase 2 planning
- Consider per-job-type timeout configuration
- Evaluate job failure alerting (Telegram)

---

*Plan approved via consensus planning: Planner → Architect → Critic (3 iterations)*
