# PolyEdge Improvement Plan — 2026-04-07

## Research Basis
Deep codebase audit across 41 files: backend/, frontend/src/, tests/, docker-compose.yml, Dockerfile, requirements.txt.

---

## P0 — Critical (fix before any live trading)

### P0-1: Direction bug — all weather trades buy YES even on "no" signals
- **File**: `backend/core/orchestrator.py:180`
- **Bug**: `side = "BUY" if signal.direction == "yes" else "BUY"` — both branches return "BUY"
- **Fix**: Remove ternary. Intent is always BUY (the correct outcome token). Pair with correct token_id selection for NO tokens.
- **Test**: `assert _execute_weather_signal(no_signal)` uses NO token_id

### P0-2: `_condition_to_token` is a stub — copy trades use wrong token_id in live mode
- **File**: `backend/core/orchestrator.py:290-296`
- **Bug**: Returns `condition_id` as-is. CLOB requires the numeric token_id.
- **Fix**: Fetch `GET /gamma-api.polymarket.com/markets?conditionId={id}`, extract `tokens[0 or 1].token_id` based on outcome. LRU-cache results (mapping is immutable).
- **Test**: `assert _condition_to_token("0xabc", "YES") == "12345678901234567890"`

### P0-3: Admin settings API has no authentication
- **File**: `backend/api/main.py:1187-1226`
- **Bug**: Any network client can call `POST /api/admin/settings` to change `POLYMARKET_PRIVATE_KEY`, `TRADING_MODE`, etc.
- **Fix**: Read `ADMIN_API_KEY` from settings (optional str). If set, require `Authorization: Bearer <key>` header on all `/api/admin/*` and `/api/bot/*` routes. Return 401 if missing/invalid.
- **Test**: `POST /api/admin/settings` without token → 401; with token → 200

### P0-4: `.env` write has newline injection vulnerability
- **File**: `backend/api/main.py:1215-1224`
- **Bug**: Value `"\nPOLYMARKET_PRIVATE_KEY=attacker"` injects into `.env`
- **Fix**: Strip `\n`, `\r` from all values before writing. Validate field names against `hasattr(settings, field)` allowlist (already done — extend to values).
- **Test**: Injected newline in value → stripped in written `.env`

### P0-5: EIP-712 hash fallback for non-numeric token_id is silently wrong
- **File**: `backend/data/polymarket_clob.py:245`
- **Bug**: `abs(hash(token_id)) % (2**128)` is non-deterministic (PYTHONHASHSEED) and produces invalid on-chain signatures
- **Fix**: Remove fallback. Raise `ValueError("token_id must be numeric")` if not `token_id.isdigit()`
- **Test**: `_sign_order_eip712("uuid-format-id", ...)` raises ValueError

---

## P1 — Important

### P1-1: CORS allows all origins
- **File**: `backend/api/main.py:27-32`
- **Fix**: `CORS_ORIGINS: str = "http://localhost:5173"` in config. Parse as comma-separated list.

### P1-2: Settlement is sequential — N+1 HTTP calls
- **File**: `backend/core/settlement.py:250-289`
- **Fix**: `asyncio.gather(*[check_settlement(t) for t in pending], return_exceptions=True)` with `asyncio.Semaphore(10)`. Deduplicate by `market_ticker` — one API call per unique market.

### P1-3: `_search_market_in_events` fetches 400 events on every 404 with no cache
- **File**: `backend/core/settlement.py:58-83`
- **Fix**: `@functools.lru_cache(maxsize=256)` on the 404 result. After 3 consecutive 404s mark trade `result="unresolvable"` and stop checking.

### P1-4: Weather scan is serial per market — can take 60s+
- **File**: `backend/core/weather_signals.py:206-213`
- **Fix**: `asyncio.gather` with semaphore(5). Cache `(city_key, target_date)` forecasts for 10 minutes.

### P1-5: Telegram `/positions` is a placeholder
- **File**: `backend/bot/telegram_bot.py:316-325`
- **Fix**: Query `Trade.settled == False`, grouped by mode, format as summary table.

### P1-6: New trades don't set `trading_mode` field
- **File**: `backend/core/scheduler.py` (Trade constructors)
- **Fix**: Add `trading_mode=settings.TRADING_MODE` to every `Trade(...)` instantiation.

### P1-7: `ensure_schema` adds `trading_mode` column without backfilling NULL rows
- **File**: `backend/models/database.py:185-187`
- **Fix**: After `ALTER TABLE`, run `UPDATE trades SET trading_mode = 'paper' WHERE trading_mode IS NULL`.

### P1-8: Paper P&L never written to `BotState.paper_pnl`
- **File**: `backend/core/settlement.py:305-327`
- **Fix**: In `update_bot_state_with_settlements`, branch on `trade.trading_mode`: update `paper_pnl/paper_bankroll` for paper trades, `total_pnl/bankroll` for live.

### P1-9: Copy trader bankroll estimation is 100x off for some traders
- **File**: `backend/strategies/copy_trader.py:112`
- **Fix**: Use `GET /data-api.polymarket.com/positions?user={wallet}` to sum position sizes. Fall back to heuristic only on failure.

### P1-10: WebSocket no max_retries — silently retries forever
- **File**: `backend/data/ws_client.py`
- **Fix**: `max_consecutive_failures=20` parameter. After exhausting, call optional `on_failure` callback (for Telegram alert) and stop.

### P1-11: SQLite concurrent writers in Docker (api + bot containers)
- **File**: `docker-compose.yml`, `backend/models/database.py`
- **Fix**: Add `postgres` service to docker-compose.yml with `DATABASE_URL=postgresql://polyedge:polyedge@db:5432/polyedge`. Keep SQLite as dev default. Add WAL pragma for SQLite: `PRAGMA journal_mode=WAL`.

### P1-12: `clob_from_settings` uses unnecessary `getattr` guards
- **File**: `backend/data/polymarket_clob.py:455-456`
- **Fix**: Use `settings.POLYMARKET_API_SECRET` directly.

---

## P2 — Nice-to-have

### P2-1: Dashboard header hardcodes "Sim" badge
- **File**: `frontend/src/pages/Dashboard.tsx:178`
- **Fix**: Add `trading_mode` to `/api/dashboard` response. Render `🟠 Paper / 🟡 Testnet / 🔴 Live` badge dynamically.

### P2-2: No axios request timeout
- **File**: `frontend/src/api.ts:6`
- **Fix**: `timeout: 15000` in axios.create config.

### P2-3: No React ErrorBoundary
- **File**: `frontend/src/App.tsx`
- **Fix**: Wrap routes in `<ErrorBoundary>` with retry button.

### P2-4: Missing test coverage (settlement, scheduler, admin API, telegram)
- **Files**: `tests/test_settlement.py`, `tests/test_admin_api.py` (new)
- **Fix**: Add `TestCalculatePnl`, `TestSettlePending`, `TestAdminAuth` test classes.

### P2-5: Calibration proxy uses arbitrary ±1°F
- **File**: `backend/core/settlement.py:358-361`
- **Fix**: Fetch historical actuals via Open-Meteo `/v1/archive` API. Use real observed temp when available.

### P2-6: Duplicate scheduler start (API startup + Orchestrator)
- **File**: `backend/api/main.py:264-265`, `backend/core/orchestrator.py:74`
- **Fix**: `DISABLE_SCHEDULER: bool = False` in config. Set True in bot service docker-compose env.

### P2-7: Copy trade deduplication within poll batch
- **File**: `backend/strategies/copy_trader.py` / `backend/core/orchestrator.py`
- **Fix**: Deduplicate copy signals by `condition_id` within each `poll_once()` batch.

### P2-8: Market staleness timeout (settled at 0.5, stays pending forever)
- **File**: `backend/core/settlement.py`
- **Fix**: If `trade.timestamp < now - 7_days` and still unsettled, mark `result="expired"`.

---

## Acceptance Criteria

- [ ] `POST /api/admin/settings` without auth token → HTTP 401
- [ ] Weather "no" signal executes on NO token, not YES token  
- [ ] Copy trade in testnet/live uses Gamma API token_id (numeric), not condition_id
- [ ] `_sign_order_eip712("not-a-number")` raises ValueError
- [ ] Settling 20 trades completes in <15 seconds (concurrent)
- [ ] New trades created with `trading_mode=settings.TRADING_MODE`
- [ ] `/positions` Telegram command returns real open trade summary
- [ ] Paper equity curve separate from live equity curve
- [ ] All 98 existing tests continue to pass
- [ ] `npm run build` succeeds with 0 TypeScript errors

---

## Recommended Sprint Order

**Day 1 (P0):** P0-1 direction bug → P0-3 admin auth → P0-4 env injection → P0-2 token_id lookup → P0-5 EIP-712 guard  
**Day 2 (P1 correctness):** P1-6 trading_mode in trades → P1-7 backfill → P1-8 paper P&L split → P1-5 /positions → P1-1 CORS  
**Day 3 (P1 performance):** P1-2 concurrent settlement → P1-4 concurrent weather scan → P1-3 404 cache → P1-10 WS max_retries  
**Day 4 (P2):** P2-1 mode badge → P2-2 axios timeout → P2-3 ErrorBoundary → P2-4 test coverage
