# PolyEdge — Gap Audit Fix Plan
Last updated: 2026-04-07

## Critical Issues

### C1 — Bot never schedules scan/trade jobs
- File: backend/core/scheduler.py:529–585
- Fix: Add scheduler.add_job(scan_and_trade_job) and weather equivalent in start_scheduler()
- IDs: "market_scan", "weather_scan"

### C2 — PRAGMA table_info crashes on Postgres
- File: backend/models/database.py:348
- Fix: Replace PRAGMA with inspector.get_columns('trades')

### C3 — Credential hot-reload only updates API process
- File: backend/api/main.py:1432, ecosystem.config.js
- Fix: Add subprocess.run(["pm2", "restart", "polyedge-bot"]) after .env write

## Major Issues

### M1 — TradeResponse strips strategy/signal_source/confidence
- File: backend/api/main.py:153
- Fix: Add Optional[str]/Optional[float] fields to TradeResponse Pydantic model

### M3 — Telegram test button hits wrong URL (404)
- File: frontend/src/pages/Admin.tsx:464
- Fix: Change /api/admin/telegram-test to /api/admin/alerts/test

### M4 — reschedule_jobs references unregistered job IDs
- File: backend/core/scheduler.py:616
- Fix: Add JobLookupError guard; ensure IDs match after C1 fix

### M5 — DecisionLog backfill can corrupt multi-strategy decisions
- File: backend/core/settlement.py:382
- Fix: Narrow query to include strategy from TradeContext

### M6 — /api/health missing bot_running field
- File: backend/api/main.py:339
- Fix: Add bot_running: bool to health response

### M7 — vite preview crashes without dist/ on fresh deploy
- File: ecosystem.config.js:22
- Fix: Add build guard in start command

## Minor Issues

### m1+m6 — StatsCards testnet mode shows wrong stats
- File: frontend/src/components/StatsCards.tsx:10
- Fix: Handle testnet mode (use paper stats for non-live modes)

### m2 — Wrong Python path in ecosystem.config.js
- File: ecosystem.config.js:6,41
- Fix: Change /usr/bin/python to python3

### m3 — ensure_schema ALTER TABLE missing conn.begin()
- File: backend/models/database.py:346
- Fix: Wrap in with conn.begin():

### m4 — copyTrader/status uses adminApi unnecessarily
- File: frontend/src/api.ts:163
- Non-blocking; document as-is

## Execution Batches

Batch A (backend): C1, C2, C3, M1, M4, M5, M6, m3
Batch B (frontend): M3, m1/m6
Standalone: m2 (ecosystem.config.js)
