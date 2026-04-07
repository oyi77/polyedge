# PolyEdge Bulletproof — Implementation Plan

**Goal:** Fix broken settlement/PNL pipeline, repair copy trader stubs, harden runtime configuration, and surface paper/whale/settlement state in the UI so PolyEdge becomes a trustworthy paper/testnet/live trading bot.

**Stack:** Python/FastAPI backend + React/TypeScript frontend + APScheduler + SQLAlchemy.

**Modes affected:** paper, testnet, live.

---

## Context

A 73-trade run produced 0 PNL despite trades being recorded, indicating settlement is silently failing. Several features (copy trader token mapping, dynamic settings reload, paper PNL surface, whale tracker UI, settlement audit trail) are stubs or unwired. This plan delivers correctness first (P0), then resilience (P1), then visibility (P2/UI).

## Guardrails

**Must Have**
- Real fixes only — no mocks, stubs, or placeholders (per user directive).
- Each phase ends with a verifier pass producing concrete evidence (HTTP responses, DB rows, log lines).
- Backwards-compatible DB migrations (additive columns, default values).
- Settings changes must take effect without process restart for scheduler-driven jobs.

**Must NOT**
- Do not refactor unrelated modules.
- Do not introduce new strategies — fix what exists.
- Do not silently swallow exceptions; surface them through API status fields and logs.
- Do not break existing `/api/stats` schema consumers — extend, do not rename.

---

## Phase 1 — P0: Make Settlement, Copy Trader, and Settings Actually Work

Goal: After Phase 1, a manual `POST /api/settle-trades` settles real trades, `/api/stats` shows non-zero PNL when trades have resolved, copy trader posts correct token_ids, and changing settings takes effect on the next scheduler tick.

### Step 1.1 — Diagnose and repair the settlement pipeline (large)

**Files:**
- `backend/core/settlement.py` (entire module, focus 17, 256-265)
- `backend/core/scheduler.py`
- `backend/api/main.py:308-323` (`/api/stats`), settle endpoints
- `backend/models/database.py` (Trade model — confirm `settled`, `pnl`, `resolved_outcome` columns)

**Tasks:**
1. Add structured logging at scheduler startup (`scheduler.start()`) confirming each registered job name + next run time. Log on every settlement tick: `trades_to_settle`, `api_calls_made`, `settled_count`, `errors`.
2. Trace why the existing 73 trades did not settle: query DB for `Trade.settled == False`, capture sample `market_ticker`/`condition_id`, hit Polymarket resolution API manually inside the verifier, and identify whether the failure is (a) scheduler not running, (b) API 404s, (c) exception swallowed, (d) PNL calc returns 0.
3. Fix the root cause(s) discovered. Likely fixes:
   - Ensure `scheduler.start()` is awaited in FastAPI `startup` event in `backend/api/main.py`.
   - Replace per-trade resolution lookup with a deduped pass keyed by `market_ticker` (Step 1.4 covers dedup; wire it here).
   - Make the resolution-API client raise on unexpected status, catch narrowly, and increment a counter exposed via `/api/stats`.
4. Add a fallback PNL recalculation in `/api/stats` (`backend/api/main.py:308-323`): when `BotState.total_pnl == 0` but settled trades exist, recompute `SUM(Trade.pnl WHERE settled = True)` and return that, plus a `pnl_source: "botstate" | "recalculated"` field.
5. Bound `market_404_counts` (`settlement.py:17`): convert to a TTL dict (e.g., `cachetools.TTLCache(maxsize=10_000, ttl=86400)`) and clear on bot restart.

**Acceptance criteria:**
- `POST /api/settle-trades` against a DB with at least one resolved market returns `{ "settled_count": >0, "errors": [...] }` with `settled_count > 0`.
- `GET /api/stats` returns non-zero `total_pnl` when settled trades exist; `pnl_source` field is present.
- Scheduler startup logs include a line like `scheduler started: jobs=[settle_trades, ...] next_runs=[...]`.
- `market_404_counts` size is bounded (verified by inspecting the object after 10k synthetic 404s in a REPL test).
- No bare `except:` blocks remain in `settlement.py`.

### Step 1.2 — Replace the copy trader token_id stub with a real Gamma lookup (medium)

**Files:**
- `backend/core/orchestrator.py:302-335` (`_condition_to_token`)
- `backend/strategies/copy_trader.py` (callers)
- `backend/clients/gamma.py` (or wherever Gamma API client lives — locate via search)

**Tasks:**
1. Implement `_condition_to_token(condition_id, side: "YES"|"NO") -> str` that calls Gamma `/markets?condition_ids=...`, parses `clob_token_ids` (or `tokens[]` shape), and returns the correct token id for the requested side.
2. Cache results in-process (LRU, maxsize=2048) keyed by `(condition_id, side)` to avoid hammering Gamma on every copy.
3. Raise `TokenLookupError` on miss; copy trader must log and skip the trade rather than placing an order against a `condition_id`.
4. Add a unit-equivalent verifier: a small Python REPL script invoked by the verifier that calls `_condition_to_token` against a known live condition_id and asserts both YES and NO token strings are 76+ digit decimals (Polymarket CLOB token format).

**Acceptance criteria:**
- `_condition_to_token("0x...known...", "YES")` returns a numeric token id distinct from the input.
- `_condition_to_token(..., "YES") != _condition_to_token(..., "NO")`.
- Copy trader log emits `token_resolved condition=... side=YES token=...` immediately before order placement.
- No code path returns `condition_id` as a token id.

### Step 1.3 — Live-reload settings into scheduler jobs (medium)

**Files:**
- `backend/api/main.py:1219-1259` (settings update endpoint)
- `backend/core/scheduler.py`
- Any strategy/job module that imports `from backend.config import settings` at module level

**Tasks:**
1. Audit jobs and strategies for module-level captures of settings (e.g., `INTERVAL = settings.scan_interval`). Replace with runtime reads inside the job function body.
2. In the settings update endpoint, after persisting changes, call `scheduler.refresh()` which:
   - Iterates registered jobs.
   - For interval-based jobs whose interval is sourced from settings, calls `scheduler.reschedule_job(job_id, trigger=IntervalTrigger(seconds=settings.<field>))`.
3. Return the new effective schedule in the settings PATCH response: `{ "settings": {...}, "scheduler": [{ "job_id": "...", "next_run": "..." }] }`.

**Acceptance criteria:**
- `PATCH /api/settings` with a new scan interval returns a `scheduler` array showing the updated `next_run`.
- Subsequent `GET /api/scheduler/jobs` (or equivalent) reflects the new interval without restarting the process.
- Grep confirms no remaining `INTERVAL = settings.X` style module-level captures in `backend/core/` and `backend/strategies/`.

### Phase 1 Verification

Run the verifier agent with the following checks (collect outputs as evidence):
1. `curl -X POST http://localhost:8000/api/settle-trades` → `settled_count > 0` (seed at least one resolved trade if needed).
2. `curl http://localhost:8000/api/stats | jq '.total_pnl, .pnl_source'` → non-zero PNL.
3. Python REPL: import `_condition_to_token`, assert YES/NO tokens differ and match Polymarket format.
4. `curl -X PATCH http://localhost:8000/api/settings -d '{"scan_interval": 30}'` → response includes refreshed `next_run`.
5. Scheduler log line `scheduler started: jobs=[...]` present in `.omc/logs/` or stdout.

---

## Phase 2 — P1: Resilience, Persistence, and Honest Errors

Goal: After Phase 2, paper PNL is exposed, copy trader survives restart, double-start is impossible, and copy trader status surfaces real errors.

### Step 2.1 — Surface paper PNL through `/api/stats` (small)

**Files:**
- `backend/models/database.py:74-77` (`BotState` model)
- `backend/api/main.py:308-323`

**Tasks:**
1. Extend the `/api/stats` response with `paper`: `{ pnl, bankroll, trades, wins, win_rate }` and `live`: `{ pnl, bankroll, trades, wins, win_rate }`, derived from `BotState.paper_*` and `BotState.*` fields respectively.
2. Keep top-level legacy fields untouched.
3. Add `mode: "paper" | "testnet" | "live"` to make the active context explicit.

**Acceptance:** `curl /api/stats | jq '.paper.pnl, .paper.trades, .live.pnl'` returns numeric values; legacy fields unchanged.

### Step 2.2 — Honest copy trader status endpoint (small)

**Files:** `backend/api/main.py:1336-1385`

**Tasks:**
1. Remove blanket `try/except: pass`. Wrap external calls in narrow `try/except` blocks that capture the exception and add it to a `status.errors[]` array.
2. Response shape: `{ "status": "ok" | "degraded" | "down", "wallets_tracked": N, "last_scan_at": iso, "errors": [{ "source": "...", "message": "..." }] }`.
3. Return HTTP 200 with `status=degraded` for partial failures, 503 for `status=down`.

**Acceptance:** Forcibly break the upstream (e.g., point Gamma URL to invalid host) → endpoint returns `status: "down"` and a non-empty `errors` array instead of `wallets_tracked: 0` silently.

### Step 2.3 — Persist copy trader entry sizes (medium)

**Files:** `backend/strategies/copy_trader.py:155-159`, `backend/models/database.py`

**Tasks:**
1. Add a `CopyTraderEntry` table: `(wallet, condition_id, side, size, opened_at)` with a unique constraint on `(wallet, condition_id, side)`.
2. Replace the in-memory `_entry_sizes` dict with read/write helpers that hit this table inside the existing DB session pattern.
3. On startup, no rehydration needed — the table is the source of truth.
4. Add an `/api/copy-trader/positions` GET that lists current entries (read-only) for verification.

**Acceptance:** Stop the bot, restart, `GET /api/copy-trader/positions` returns the same entries that existed before restart.

### Step 2.4 — Idempotent bot start/stop (small)

**Files:** `backend/api/main.py:799-856`

**Tasks:**
1. `POST /api/bot/start`: if `BotState.running == True`, return HTTP 409 `{ "error": "already_running" }`.
2. `POST /api/bot/stop`: if `BotState.running == False`, return HTTP 409 `{ "error": "already_stopped" }`.
3. Keep state transitions inside a single DB transaction to avoid TOCTOU.

**Acceptance:** Two consecutive `POST /api/bot/start` calls → first returns 200, second returns 409.

### Step 2.5 — Dedupe settlement API calls per market (small)

**Files:** `backend/core/settlement.py:256-265`

**Tasks:**
1. Before iterating trades, build `markets_needing_resolution = { trade.market_ticker for trade in unsettled_trades }`.
2. Resolve each market once, store in `resolutions: dict[str, Resolution]`, then loop trades and apply.
3. Log `api_calls_saved = len(unsettled_trades) - len(markets_needing_resolution)`.

**Acceptance:** With 50 unsettled trades across 5 markets, settlement log shows exactly 5 resolution API calls and `api_calls_saved=45`.

### Phase 2 Verification

1. `/api/stats` schema diff shows `paper`, `live`, `mode` fields present.
2. Forced upstream failure → `/api/copy-trader/status` returns `status: "down"`.
3. Bot restart preserves copy trader entries (DB row count unchanged).
4. Double-start returns 409.
5. Settlement log proves dedup math.

---

## Phase 3 — P2 + Frontend: Visibility and Operator UX

Goal: Operators can see paper vs live PNL, browse settlement history, and monitor the whale/copy tracker without diving into Admin.

### Step 3.1 — Settlement history endpoint + audit log (medium)

**Files:**
- `backend/api/main.py` (new route)
- `backend/models/database.py` (add `SettlementEvent` table if absent)
- `backend/core/settlement.py` (write events on each settle)

**Tasks:**
1. Add `SettlementEvent(id, trade_id, market_ticker, resolved_outcome, pnl, settled_at, source)`.
2. On every successful settlement, insert one row.
3. Expose `GET /api/settlements?limit=100&offset=0` returning paginated history sorted by `settled_at DESC`.

**Acceptance:** After Phase 1 verifier seeded a settlement, `GET /api/settlements` returns at least one row with all fields populated.

### Step 3.2 — Frontend dashboard: paper vs live PNL split (small)

**Files:** `frontend/src/...` (locate Dashboard component via grep for `total_pnl`)

**Tasks:**
1. Update the dashboard query to consume the new `paper` / `live` blocks.
2. Render two side-by-side cards: "Paper" and "Live" with PNL, trades, win rate, bankroll.
3. Highlight the active `mode` badge.

**Acceptance:** Visiting the dashboard in paper mode shows the Paper card highlighted with non-zero numbers when paper trades exist.

### Step 3.3 — Frontend: Whale Tracker page (medium)

**Files:** `frontend/src/...` (new route `/whale-tracker`), router config, nav menu

**Tasks:**
1. Create a top-level route `/whale-tracker` (rename from copy-trader concept in UI copy only — backend names stay).
2. Page sections: Tracked wallets table, Live positions (from `/api/copy-trader/positions`), Status banner (from `/api/copy-trader/status` with degraded/down colors).
3. Add nav entry in the main sidebar (remove the Admin-only hiding).

**Acceptance:** Navigating to `/whale-tracker` shows wallets, positions, and a green/yellow/red status indicator that reacts to forced upstream failures.

### Step 3.4 — Frontend: Settlement history page (small)

**Files:** `frontend/src/...` (new route `/settlements`)

**Tasks:**
1. Table view of `GET /api/settlements` with columns: time, market, outcome, PNL, source.
2. Add filter by `pnl > 0 / < 0` and search by market ticker.
3. Link from each row to the corresponding trade.

**Acceptance:** Page loads, paginates, and reflects new settlements within one refresh after Phase 1 verifier triggers a settle.

### Phase 3 Verification

1. Open `/whale-tracker`, force upstream failure, status turns red.
2. Open `/settlements`, confirm rows match `GET /api/settlements` JSON.
3. Open dashboard in paper mode, confirm Paper card shows non-zero values matching `BotState.paper_pnl`.
4. Visual verifier (`/oh-my-claudecode:visual-verdict`) screenshots all three pages and confirms no console errors.

---

## Cross-Cutting

- **Migrations:** add an Alembic revision (or the project's existing migration mechanism — verify during Step 1.1) for `CopyTraderEntry` and `SettlementEvent`.
- **Logging:** all new error paths log with `extra={"component": "settlement|copy_trader|scheduler"}` for filterability.
- **Tests:** prefer real verifier scripts (HTTP + DB inspection) over mock-based unit tests, in line with the no-mocks directive.

## Success Criteria (Whole Plan)

- A fresh paper-mode run of 10 trades, after market resolution, produces `total_pnl != 0` in `/api/stats` automatically (no manual settle needed).
- Copy trader posts orders with real Polymarket CLOB token ids (verified by capturing one outbound order payload in logs).
- Updating `scan_interval` via `PATCH /api/settings` changes the next scheduled run time without restart.
- Frontend dashboard shows distinct Paper and Live PNL cards.
- `/whale-tracker` and `/settlements` pages exist, are linked from the main nav, and render real backend data.
- No `except: pass`, no `return condition_id`, no module-level `settings.X` captures remain in `backend/core/` or `backend/strategies/`.

## Effort Summary

| Phase | Step | Effort |
|---|---|---|
| 1 | 1.1 Settlement repair | Large |
| 1 | 1.2 Token id lookup | Medium |
| 1 | 1.3 Settings live-reload | Medium |
| 2 | 2.1 Paper PNL in stats | Small |
| 2 | 2.2 Honest copy trader status | Small |
| 2 | 2.3 Persist entry sizes | Medium |
| 2 | 2.4 Idempotent start/stop | Small |
| 2 | 2.5 Settlement dedup | Small |
| 3 | 3.1 Settlement history API | Medium |
| 3 | 3.2 Dashboard paper/live split | Small |
| 3 | 3.3 Whale Tracker page | Medium |
| 3 | 3.4 Settlement history page | Small |

Total: 1 Large, 5 Medium, 6 Small.

## Handoff

When ready, run `/oh-my-claudecode:start-work polyedge-bulletproof` to begin Phase 1. Do not start Phase 2 until Phase 1 verification evidence is collected. Do not start Phase 3 until Phase 2 verification passes.
