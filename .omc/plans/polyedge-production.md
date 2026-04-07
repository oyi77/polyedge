# PolyEdge Production Transformation Plan

**Plan ID:** polyedge-production
**Created:** 2026-04-07
**Owner:** Planner (oh-my-claudecode)
**Scope:** Transform PolyEdge from hardcoded POC into a 24/7 autonomous, configurable, fully audited Polymarket trading platform.
**Estimated complexity:** HIGH (6 phases, ~32 stories, 2-3 week build with parallel lanes)

---

## 1. Context

PolyEdge today is a working FastAPI + React app with paper/testnet/live mode switching, a settlement pipeline, a basic copy trader, and a dashboard. Its critical limitations are:

- It scans only ~2% of Polymarket markets (hardcoded BTC 5-min regex + 8 hardcoded weather cities).
- Strategies are baked into `core/scheduler.py` with no plugin contract, registry, or per-strategy config.
- There is no decision audit trail — trades exist, but the *why* does not.
- Trade history lacks signal source, strategy name, confidence, and the inputs that fired it.
- The whale tracker watches only the top 10 leaderboard wallets; users cannot add wallets or filter.
- Tests are essentially nonexistent on both ends.
- The known $40M/yr Kalshi <-> Polymarket arb edge is unimplemented.
- The BTC 5-min momentum strategy has documented negative live EV (-49.5% ROI) but is still wired in.

The user has issued nine non-negotiable requirements (whale leaderboard, full table filtering, 24/7 autonomous trading, zero hardcoded values, real execution only, working tests, complete trade history, decision log, market intelligence page).

**This plan delivers all nine in six phases**, each phase ending in working software (not scaffolding).

---

## 2. Work Objectives

1. **Foundation (Phase 1):** Plugin strategy contract + registry + config tables; refactor scheduler to drive strategies generically. No new strategies yet — same behavior, new shape.
2. **Data Layer (Phase 2):** New tables (`DecisionLog`, `MarketWatch`, `WalletConfig`, `StrategyConfig`, `TradeContext`), additive `ensure_schema()` migrations, full CRUD APIs.
3. **Universal Market Scanner (Phase 3):** Replace hardcoded BTC/weather fetchers with a paginated Gamma scanner + keyword/category filter, surfaced through `MarketWatch` config.
4. **Production Strategies (Phase 4):** Refactor copy trader onto `BaseStrategy`; add `weather_emos`, `kalshi_arb`, `btc_oracle`. Gate negative-EV `btc_5m` as experimental (disabled by default).
5. **Frontend (Phase 5):** Whale leaderboard page (full filtering/sort), Market Intelligence page, Decision Log page, Trade History upgrade, Strategy Config admin tab, Market Watch admin tab. Every table gets sortable columns + multi-filter.
6. **Tests + 24/7 Hardening (Phase 6):** Vitest + RTL frontend tests, pytest + httpx backend integration tests, watchdog/heartbeat job, auto-recovery, alerting hook.

---

## 3. Guardrails

### Must Have
- Every new code path is reachable via UI **and** REST.
- Every config value lives in DB or `.env` — zero magic constants in `strategies/`, `core/`, or `data/`.
- Every trade row links to a `TradeContext` row and at least one `DecisionLog` row.
- Every strategy implements `BaseStrategy` and self-registers via `STRATEGY_REGISTRY`.
- Additive-only migrations (`ensure_schema()` pattern); no Alembic, no destructive ALTER.
- All money-moving paths (live mode) have integration tests against testnet.
- PM2 process must self-recover on crash; heartbeat row updated every cycle.
- No mocks, stubs, or placeholders in `backend/strategies/`, `backend/core/`, `backend/data/`, or `backend/api/`. Mocks allowed only under `backend/tests/` and `frontend/src/**/__tests__/`.

### Must NOT Have
- No hardcoded market tickers, city names, wallet addresses, or numeric thresholds outside `config.py` defaults or DB seed scripts.
- No silent failures — every exception path writes to `DecisionLog` or `SettlementEvent` or logs at ERROR with structured fields.
- No new strategy added directly to `scheduler.py` — must go through the registry.
- No frontend table without sort + filter (the only exception is single-row status banners).
- No "TODO" comments left in production paths at phase end — file an issue or implement.

---

## 4. Phase Breakdown

```
Phase 1: Foundation         (S1.1 - S1.4)  ~3 days  — strategy plugin contract, registry, scheduler refactor
Phase 2: Data Layer         (S2.1 - S2.5)  ~2 days  — 5 new tables, CRUD APIs, decision log writer
Phase 3: Market Scanner     (S3.1 - S3.3)  ~2 days  — Gamma pagination, keyword filter, MarketWatch wiring
Phase 4: Strategies         (S4.1 - S4.5)  ~4 days  — copy_trader refactor, weather_emos, kalshi_arb, btc_oracle, btc_5m gating
Phase 5: Frontend           (S5.1 - S5.7)  ~4 days  — whale leaderboard, market intel, decision log, trade history, strategy/market admin, table primitives
Phase 6: Tests + Hardening  (S6.1 - S6.5)  ~3 days  — vitest, pytest, watchdog, heartbeat, alerting
```

Each phase ends with working, deployable software. Phases 3 and 4 can run partially in parallel once Phase 1 lands.

---

## 5. Stories

### Phase 1 — Foundation (Strategy Plugin System)

#### S1.1 — BaseStrategy abstract contract
**Files to create:** `backend/strategies/base.py`
**Files to modify:** none
**Description:** Define the contract every strategy must satisfy. Abstract class with: `name: str`, `description: str`, `enabled: bool`, `category: str`, `default_params: dict`, async `market_filter(markets: list[MarketInfo]) -> list[MarketInfo]`, async `run_cycle(ctx: StrategyContext) -> CycleResult`. `StrategyContext` carries db session, clob client, settings, logger, and current `StrategyConfig.params`. `CycleResult` carries decisions placed, trades attempted, errors.
**Acceptance criteria:**
- `python -c "from backend.strategies.base import BaseStrategy, StrategyContext, CycleResult"` succeeds.
- Importing a subclass that omits `name` or `run_cycle` raises `TypeError` at instantiation (verified by `pytest backend/tests/test_base_strategy.py::test_abstract_enforcement`).
- `BaseStrategy` exposes `__init_subclass__` hook that auto-registers into `STRATEGY_REGISTRY` unless `abstract=True`.

#### S1.2 — Strategy registry + factory
**Files to create:** `backend/strategies/registry.py`
**Acceptance criteria:**
- `STRATEGY_REGISTRY: dict[str, type[BaseStrategy]]` populated at import time.
- `create_strategy(name, db, clob, settings) -> BaseStrategy` returns a wired instance, raising `KeyError` for unknown names.
- `list_strategies() -> list[StrategyMeta]` returns name, description, category, enabled, default_params for every registered class.
- Unit test verifies registering two dummy strategies and retrieving both.

#### S1.3 — Scheduler refactor to registry-driven dispatch
**Files to modify:** `backend/core/scheduler.py`, `backend/core/orchestrator.py`
**Description:** Remove hardcoded `scan_and_trade_job`/`weather_scan_job` direct calls. Replace with a generic `strategy_cycle_job(strategy_name)` that loads `StrategyConfig` row, instantiates via registry, and runs `run_cycle`. Orchestrator on startup reads all enabled `StrategyConfig` rows and schedules one APScheduler job per strategy with its configured interval.
**Acceptance criteria:**
- `grep -n "scan_and_trade_job\|weather_scan_job" backend/core/scheduler.py` returns zero matches after refactor (legacy names removed or aliased to registry dispatch).
- Starting orchestrator with an empty `strategy_config` table schedules zero strategy jobs (settlement + heartbeat still scheduled).
- Inserting a row `(strategy_name='copy_trader', enabled=true, params={"interval_seconds": 60})` and restarting causes APScheduler to log `Added job "strategy_cycle_job:copy_trader"`.
- `GET /api/admin/scheduler/jobs` returns the live job list.

#### S1.4 — Copy trader migrated onto BaseStrategy (compat shim)
**Files to modify:** `backend/strategies/copy_trader.py`
**Description:** Wrap existing `CopyTrader` logic in a `CopyTraderStrategy(BaseStrategy)` subclass. Existing class stays as the engine; the strategy class is a thin adapter calling `engine.run_once()` from within `run_cycle`. No behavior change.
**Acceptance criteria:**
- `STRATEGY_REGISTRY["copy_trader"]` resolves to `CopyTraderStrategy`.
- After Phase 1 deploy, copy trader still produces `CopyTraderEntry` rows on its normal cadence (verified by counting rows before/after a 5-minute live window in paper mode).
- `pytest backend/tests/test_copy_trader_strategy.py` passes (smoke: instantiate, run one cycle against fixture wallets, assert at least one decision row written).

---

### Phase 2 — Data Layer

#### S2.1 — New SQLAlchemy models + ensure_schema migration
**Files to modify:** `backend/models/database.py`
**Description:** Add five models exactly as specified in the architecture brief. Extend `ensure_schema()` to `CREATE TABLE IF NOT EXISTS` for each, plus add new columns to `Trade` (`strategy`, `signal_source`, `confidence`) via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (SQLite pragma check pattern already used in repo).
**Models:**
- `DecisionLog(id, strategy, market_ticker, decision[BUY|SKIP|SELL|HOLD], confidence, signal_data JSON, reason TEXT, created_at)`
- `MarketWatch(id, ticker, category, source, config JSON, enabled, created_at, updated_at)`
- `WalletConfig(id, address UNIQUE, pseudonym, source[leaderboard|user|import], tags JSON, enabled, notes, added_at)`
- `StrategyConfig(id, strategy_name UNIQUE, enabled, params JSON, interval_seconds, updated_at)`
- `TradeContext(trade_id PK FK, strategy, signal_source, confidence, entry_signal JSON, exit_signal JSON NULL, created_at)`
**Acceptance criteria:**
- Restarting the API on an existing DB does not error and adds the new tables (verified via `sqlite3 polyedge.db ".schema decision_log"`).
- All five tables visible in `sqlite_master`.
- `Trade` has new columns; existing rows survive (pre/post row count identical for fixture DB).
- Round-trip insert/select test for each model passes (`pytest backend/tests/test_models_phase2.py`).

#### S2.2 — DecisionLog writer helper
**Files to create:** `backend/core/decisions.py`
**Description:** Single function `record_decision(db, strategy, market_ticker, decision, confidence, signal_data, reason)` that inserts a row and flushes. Used by every strategy on every BUY/SKIP/SELL/HOLD evaluation — including skips.
**Acceptance criteria:**
- Function inserts row with timezone-aware UTC `created_at`.
- Function does not raise on JSON-serializable failures (uses `default=str` fallback) but logs at WARNING.
- Strategy contract docstring mandates calling it for every decision boundary.

#### S2.3 — REST API: StrategyConfig CRUD
**Files to modify:** `backend/api/main.py`
**Endpoints:**
- `GET /api/strategies` -> list all (registry meta merged with DB row state)
- `GET /api/strategies/{name}` -> single
- `PUT /api/strategies/{name}` -> upsert `enabled`, `params`, `interval_seconds`; triggers scheduler reload for that strategy
- `POST /api/strategies/{name}/run-now` -> fires one cycle synchronously, returns CycleResult JSON
**Acceptance criteria:**
- Curl `PUT` flips `enabled` and the next `GET` reflects it within the same process.
- `run-now` against `copy_trader` returns 200 with non-null `decisions_recorded`.
- Unknown strategy returns 404.

#### S2.4 — REST API: MarketWatch + WalletConfig CRUD
**Files to modify:** `backend/api/main.py`
**Endpoints:**
- `GET/POST/PUT/DELETE /api/markets/watch`
- `GET/POST/PUT/DELETE /api/wallets/config`
- Both list endpoints accept `?enabled=&category=&source=&q=&sort=&order=&limit=&offset=` and return `{items, total}`.
**Acceptance criteria:**
- All four CRUD verbs return correct status codes (`POST` 201, `DELETE` 204, conflict 409 on duplicate ticker/address).
- List filtering verified by 6 curl assertions in `backend/tests/test_market_watch_api.py`.
- Pagination math: requesting `limit=10&offset=20` on a 35-row fixture returns 10 items with `total=35`.

#### S2.5 — REST API: DecisionLog + Trade history with context
**Files to modify:** `backend/api/main.py`
**Endpoints:**
- `GET /api/decisions?strategy=&decision=&market=&since=&until=&sort=&limit=&offset=`
- `GET /api/trades?strategy=&signal_source=&min_confidence=&status=&since=&sort=&limit=&offset=` — joins `TradeContext`.
**Acceptance criteria:**
- A trade placed by `copy_trader` after Phase 4 returns from `/api/trades` with non-null `strategy`, `signal_source`, `confidence`, `entry_signal`.
- `/api/decisions?strategy=copy_trader&decision=SKIP` returns only matching rows.
- Each list response includes `total` count and respects `sort=created_at&order=desc` by default.

---

### Phase 3 — Universal Market Scanner

#### S3.1 — Gamma paginated fetcher
**Files to create:** `backend/core/market_scanner.py`
**Files to modify:** `backend/data/btc_markets.py`, `backend/data/weather_markets.py` (delegate to scanner)
**Description:** Implement `fetch_all_active_markets(category=None, limit=None) -> list[MarketInfo]` that walks Gamma's `/markets?active=true&closed=false&offset=...` pages until exhaustion or `limit`. Returns a typed dataclass with ticker, slug, category, end_date, volume, liquidity, raw metadata. Rate-limited to <= 5 req/s with simple semaphore.
**Acceptance criteria:**
- Live call against Gamma returns >= 500 markets in paper mode (verified by `python -m backend.scripts.scanner_smoke`).
- `fetch_markets_by_keywords(["btc","bitcoin"])` returns >= 1 BTC market.
- `fetch_markets_by_keywords(["new york","chicago","weather"])` returns >= 1 weather market.
- Fetcher honors a 30-second timeout per page and retries 2x on transient 5xx.

#### S3.2 — Strategy market filtering via MarketWatch config
**Files to modify:** `backend/strategies/base.py` (default `market_filter` impl), `backend/strategies/copy_trader.py`
**Description:** Default `market_filter` reads `MarketWatch` rows where `source=strategy_name OR category in strategy.categories` and intersects with the scanner result. Strategies override only when they need custom logic.
**Acceptance criteria:**
- Inserting a `MarketWatch` row with `ticker='will-btc-hit-100k-by-eoy'` and re-running `copy_trader` includes that ticker in its candidate list (verified by `DecisionLog` row referencing it).
- Removing the row causes the next cycle to drop it.

#### S3.3 — Replace hardcoded BTC and weather fetchers
**Files to modify:** `backend/data/btc_markets.py`, `backend/data/weather_markets.py`
**Description:** Both files become thin wrappers around `market_scanner.fetch_markets_by_keywords` with their keyword sets pulled from `StrategyConfig.params.keywords` (seeded at install time so existing behavior holds). Hardcoded `CITY_ALIASES` and BTC regex are deleted; defaults move to `backend/scripts/seed_strategy_configs.py`.
**Acceptance criteria:**
- `grep -rn "CITY_ALIASES\|btc-updown-5m" backend/data/ backend/strategies/` returns zero matches.
- Seeded weather config produces the same 8 cities the old code targeted (regression check against fixture).
- Updating `StrategyConfig.params.keywords` for `weather_emos` and re-running picks up a 9th city without code change.

---

### Phase 4 — Production Strategies

#### S4.1 — Weather EMOS strategy
**Files to create:** `backend/strategies/weather_emos.py`, `backend/data/weather_providers.py`
**Description:** Pull NBM percentile forecasts + Open-Meteo ensemble; apply EMOS calibration (mean shift + variance scale fitted from a rolling 30-day error window persisted to DB as `BotState` JSON). Compute Pr(market resolves YES), compare to mid-market, fire when edge > configured threshold. Every decision boundary writes `DecisionLog`.
**Acceptance criteria:**
- `pytest backend/tests/test_weather_emos.py` passes with a fixture forecast that produces a known calibrated probability within 1e-3 of expected.
- Live paper run in a 6-hour window produces >= 1 `DecisionLog` row per active weather market with `signal_data` containing `nbm_p`, `om_p`, `calibrated_p`, `market_mid`, `edge`.
- Strategy config exposes `min_edge`, `max_position_usd`, `keywords`, `calibration_window_days` as editable params.

#### S4.2 — Kalshi <-> Polymarket arb scanner
**Files to create:** `backend/strategies/kalshi_arb.py`, `backend/data/kalshi_client.py`
**Description:** For every `MarketWatch` row tagged `arb`, look up the matched Kalshi ticker (config field), pull both order books, compute crossed-book opportunities net of fees and slippage. When edge > threshold, place legs (paper/testnet first; live behind explicit flag).
**Acceptance criteria:**
- Pulls live Kalshi book for at least one configured market in <2s.
- Identifies a synthetic arb in a unit-test fixture where Polymarket YES = 0.45 and Kalshi YES = 0.55, computes edge accounting for fees, and writes a BUY decision.
- Live mode placement gated behind `StrategyConfig.params.allow_live_execution = false` by default.
- All decisions (including SKIP for sub-threshold edges) recorded.

#### S4.3 — BTC oracle latency strategy
**Files to create:** `backend/strategies/btc_oracle.py`
**Description:** Watch BTC oracle (UMA / Chainlink) settlement source vs Polymarket mid for short-duration BTC markets. When the oracle's pre-resolution price diverges from market mid by > threshold and time-to-resolution < N minutes, fire. Replaces the negative-EV momentum strategy.
**Acceptance criteria:**
- Strategy resolves at least one fixture market with deterministic signal output in `pytest backend/tests/test_btc_oracle.py`.
- DecisionLog rows include `oracle_price`, `market_mid`, `time_to_resolution_s`, `edge`.

#### S4.4 — Gate legacy `btc_5m` as experimental
**Files to modify:** `backend/strategies/` (wrap existing BTC 5m logic in a `BtcMomentumStrategy` class), `backend/scripts/seed_strategy_configs.py`
**Description:** Wrap, register, but seed `enabled=false` with prominent description: "EXPERIMENTAL — documented -49.5% live ROI. Do not enable without re-validation."
**Acceptance criteria:**
- `GET /api/strategies/btc_5m` returns `enabled=false` and the warning text.
- Scheduler does not schedule it on fresh install.
- Admin UI displays a warning badge (handled in Phase 5).

#### S4.5 — Copy trader full migration (filterable wallet pool)
**Files to modify:** `backend/strategies/copy_trader.py`
**Description:** Replace the hardcoded "top-10 leaderboard" path with: union of (a) leaderboard top-N (N from params), (b) all `WalletConfig` rows where `enabled=true`. Per-cycle, rank by params-driven scoring (PNL, win rate, recency, market category overlap). Persist decision rows for both follows and skips.
**Acceptance criteria:**
- Adding a wallet via `POST /api/wallets/config` causes the next cycle to consider it.
- Disabling a leaderboard wallet via the same endpoint excludes it.
- `DecisionLog` rows include scoring breakdown in `signal_data`.
- Existing `CopyTraderEntry` table continues to receive rows (no regression).

---

### Phase 5 — Frontend

#### S5.1 — Reusable DataTable primitive
**Files to create:** `frontend/src/components/DataTable.tsx`, `frontend/src/components/TableFilters.tsx`, `frontend/src/hooks/useTableQuery.ts`
**Description:** Generic table with column-configurable sort, multi-column filter (text/select/range/date), pagination, server-side query support via `useTableQuery` (debounced URL sync). Tailwind dark terminal styling matching existing components.
**Acceptance criteria:**
- Storybook-free smoke: rendering with 100 fixture rows, clicking a column header toggles sort, typing in filter input updates visible rows, pagination buttons advance offset.
- Vitest test in S6.1 covers sort, filter, pagination, and URL sync.
- Used by every page below.

#### S5.2 — Whale Leaderboard page
**Files to modify:** `frontend/src/pages/WhaleTracker.tsx`
**Description:** Replace basic table with full leaderboard backed by `/api/wallets/leaderboard` (new endpoint added in S5.2 backend addendum below). Columns: address (truncated + copy), pseudonym, source, PNL 30d, PNL all-time, win rate, trade count, last trade, market categories, tags, enabled toggle. Filters: PNL range, win-rate range, source, category multi-select, recency, search by address. Inline action: add to watch list / disable / edit pseudonym/tags.
**Backend addendum (in S2.4 scope):** `GET /api/wallets/leaderboard?min_pnl=&min_winrate=&category=&source=&since=&q=&sort=&limit=&offset=` returns merged leaderboard + `WalletConfig` data.
**Acceptance criteria:**
- Filtering by `min_pnl=10000` reduces row count and updates URL query string.
- Adding a new wallet from the page persists via API and shows up after refresh.
- Sorting by win rate desc orders correctly across all loaded pages.
- Table displays >= 100 wallets when leaderboard returns that many (no top-10 cap).

#### S5.3 — Market Intelligence page
**Files to create:** `frontend/src/pages/MarketIntel.tsx`, `frontend/src/components/intel/*`
**Backend addendum:** `GET /api/intel/feed` aggregates: NWS active alerts (filtered to areas matching open weather positions), Polymarket market metadata for open positions, Trading Economics calendar (free tier), CoinGecko BTC/ETH ticker, all tied to currently open trades.
**Acceptance criteria:**
- Page renders four sections (Weather Alerts, Market Metadata, Economic Calendar, Crypto). Each section uses DataTable with filters.
- Each row in Market Metadata links to its underlying Polymarket trade.
- Refresh button re-fetches; auto-refresh every 60s (configurable in localStorage).
- Empty-state copy when no open positions.

#### S5.4 — Decision Log page
**Files to create:** `frontend/src/pages/DecisionLog.tsx`
**Description:** Table backed by `/api/decisions`. Columns: timestamp, strategy, market, decision, confidence, reason (truncated + expand), signal_data (JSON viewer modal). Filters: strategy multi, decision multi, market search, date range, confidence range.
**Acceptance criteria:**
- Loads 1000 fixture rows in <1s (server-side pagination).
- Clicking a row opens a modal with full `signal_data` JSON pretty-printed.
- "Export CSV" button downloads current filter view (max 10k rows).

#### S5.5 — Trade History upgrade
**Files to modify:** `frontend/src/pages/Dashboard.tsx` or new `frontend/src/pages/TradeHistory.tsx`
**Description:** Full trade history table with strategy/signal_source/confidence/entry_signal columns. Filters mirror `/api/trades` query params. Each row links to its decision log entries (`/decisions?market=<ticker>&since=<trade.created_at - 5m>`).
**Acceptance criteria:**
- Existing dashboard PNL split unchanged.
- New table renders all columns from `TradeContext`.
- Click-through link to decision log works.

#### S5.6 — Admin: Strategies tab + Market Watch tab + Wallet Config tab
**Files to modify:** `frontend/src/pages/Admin.tsx`
**Files to create:** `frontend/src/components/admin/StrategiesPanel.tsx`, `frontend/src/components/admin/MarketWatchPanel.tsx`, `frontend/src/components/admin/WalletConfigPanel.tsx`
**Description:** Three new admin tabs, each a DataTable + edit drawer. Strategies tab shows registry meta + DB state, exposes per-strategy params editor (JSON Schema-driven if available, fall back to raw JSON textarea with validation), enable toggle, "Run Now" button, last cycle result.
**Acceptance criteria:**
- Toggling `weather_emos` enabled and saving causes scheduler to add/remove its job (verified via `/api/admin/scheduler/jobs`).
- Editing `min_edge` param persists and is reflected on next cycle.
- Adding a `MarketWatch` row from the UI persists and appears in strategy candidate lists.
- `btc_5m` row shows red "EXPERIMENTAL" badge.

#### S5.7 — NavBar updates + filter primitives consistency pass
**Files to modify:** `frontend/src/components/NavBar.tsx`, all existing tables in `Settlements.tsx`, `WhaleTracker.tsx`
**Description:** Add Whale Leaderboard, Market Intel, Decision Log, Trade History to nav. Replace any remaining ad-hoc tables with `DataTable` so every table in the app supports sort + filter.
**Acceptance criteria:**
- `grep -rn "<table" frontend/src/pages/ frontend/src/components/` returns only `DataTable` internals.
- Every page in the nav loads without console errors in `npm run build && npm run preview`.

---

### Phase 6 — Tests + 24/7 Hardening

#### S6.1 — Frontend test harness (Vitest + Testing Library)
**Files to create:** `frontend/vitest.config.ts`, `frontend/src/test/setup.ts`, `frontend/src/components/__tests__/DataTable.test.tsx`, `frontend/src/pages/__tests__/WhaleTracker.test.tsx`, `frontend/src/pages/__tests__/DecisionLog.test.tsx`
**Acceptance criteria:**
- `npm run test` exits 0 with >= 12 passing tests covering DataTable sort/filter/pagination, WhaleTracker filter interactions, DecisionLog modal, and Admin strategies toggle.
- Coverage report shows >= 60% on `components/DataTable.tsx` and the three new pages.

#### S6.2 — Backend integration tests (pytest + httpx)
**Files to create:** `backend/tests/conftest.py`, `backend/tests/test_strategies_api.py`, `backend/tests/test_decisions_api.py`, `backend/tests/test_market_watch_api.py`, `backend/tests/test_orchestrator_lifecycle.py`
**Description:** Real httpx ASGI client against the FastAPI app, real SQLite tmpfile DB, **no mocks** for internal services. External HTTP (Gamma/Kalshi/NWS) is hit through a recorded fixture layer (`vcrpy`) so tests are deterministic without faking the surface.
**Acceptance criteria:**
- `pytest backend/tests` exits 0 with >= 30 passing tests.
- Suite runs in <60s on the dev box.
- CI-friendly: no network access required after fixtures recorded.

#### S6.3 — Heartbeat + watchdog
**Files to create:** `backend/core/heartbeat.py`
**Files to modify:** `backend/core/orchestrator.py`, `backend/api/main.py`
**Description:** Every cycle of every strategy bumps a row in `BotState` (`key='heartbeat:{strategy}'`, `value=iso_ts`). A separate APScheduler watchdog job runs every 30s; if any enabled strategy's heartbeat is older than `2 * interval_seconds`, it logs ERROR, writes a `DecisionLog(decision=ERROR)` entry, and (if Telegram configured) fires an alert.
**Acceptance criteria:**
- `GET /api/health` returns `{status, strategies: [{name, last_heartbeat, lag_seconds, healthy}]}`.
- Killing a strategy mid-cycle (force exception) causes the watchdog to flag it within 60s.

#### S6.4 — Auto-recovery + PM2 ecosystem
**Files to create/modify:** `ecosystem.config.js` (or existing PM2 config), `backend/core/orchestrator.py`
**Description:** Orchestrator wraps each strategy cycle in try/except so one strategy's failure doesn't kill the loop. PM2 `max_restarts: 100`, `restart_delay: 5000`, `autorestart: true`. Crash log shipped to `.omc/logs/polyedge-crash.log`.
**Acceptance criteria:**
- Raising `RuntimeError` inside `weather_emos.run_cycle` does not stop `copy_trader` from running its next cycle.
- `pm2 restart polyedge-api` brings the app back within 10s with all strategies re-scheduled.

#### S6.5 — Alerting hook + ops runbook entry
**Files to modify:** `backend/api/main.py`, existing Telegram client
**Description:** Wire watchdog + critical errors into existing Telegram client (already in admin tab). Add `/api/admin/alerts/test` endpoint to fire a test alert. Add a short ops note in `.omc/plans/polyedge-production-runbook.md` (companion file, not this plan).
**Acceptance criteria:**
- `POST /api/admin/alerts/test` delivers a Telegram message when configured.
- Watchdog ERROR triggers exactly one alert (deduped within a 5-minute window).

---

## 6. Risks and Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|-----------|
| R1 | Gamma API pagination misses markets or rate-limits us | Med | High | S3.1 retries + 5 req/s cap; smoke script run nightly; fall back to last-known-good cache |
| R2 | Strategy refactor regresses existing copy trader behavior | Med | High | S1.4 keeps engine class intact; integration test in S6.2 verifies row counts pre/post |
| R3 | Kalshi arb live execution loses money on stale data | Med | Critical | S4.2 defaults `allow_live_execution=false`; require explicit admin action; latency budget enforced per cycle |
| R4 | EMOS calibration window cold-start produces wild bets | Low | High | S4.1 requires N >= 30 historical observations before firing live; otherwise SKIP with reason="insufficient_calibration_data" |
| R5 | SQLite contention under heavy decision-log writes | Low | Med | Decision writes batched per cycle; WAL mode already enabled; monitor via heartbeat lag |
| R6 | Frontend table primitive churn delays Phase 5 | Med | Med | S5.1 lands first and is fully tested before S5.2-S5.7 begin |
| R7 | "Zero hardcoded values" rule fights existing seeds | Med | Low | Seed scripts under `backend/scripts/seed_*.py` are explicit, version-controlled, and idempotent — they're config, not magic |
| R8 | Tests get flaky against external APIs | High | Med | S6.2 uses vcrpy cassettes; nightly job re-records and PRs the diff |
| R9 | PM2 restarts mask deeper crash loops | Low | High | S6.4 caps `max_restarts`; alert fires on >5 restarts in 10 min |
| R10 | Decision log fills disk | Low | Med | Add retention job in S6.3 (default: prune `decision_log` rows older than 90 days) |

---

## 7. Verification Steps (Per-Phase Exit Gates)

**Phase 1 exit:** Restart API, copy trader still produces `CopyTraderEntry` rows on schedule, `STRATEGY_REGISTRY` lists exactly one entry, `pytest backend/tests/test_base_strategy.py backend/tests/test_copy_trader_strategy.py` green.

**Phase 2 exit:** All five new tables exist; `pytest backend/tests/test_models_phase2.py backend/tests/test_strategies_api.py backend/tests/test_market_watch_api.py backend/tests/test_decisions_api.py` green; manual curl walk-through of every CRUD verb returns expected codes.

**Phase 3 exit:** `python -m backend.scripts.scanner_smoke` returns >= 500 markets; copy trader cycle considers a manually inserted `MarketWatch` row; `grep` for hardcoded city/btc patterns returns zero.

**Phase 4 exit:** All four production strategies registered; each writes >= 1 `DecisionLog` row in a 1-hour paper run; `btc_5m` shows `enabled=false`; `pytest backend/tests/test_weather_emos.py backend/tests/test_kalshi_arb.py backend/tests/test_btc_oracle.py` green.

**Phase 5 exit:** `npm run build` succeeds with zero TS errors; every nav page loads without console errors; every table supports sort + filter; whale leaderboard displays >= 100 wallets; admin can toggle a strategy and see scheduler reflect it.

**Phase 6 exit:** `pytest backend/tests` and `npm run test` both green; killing a strategy triggers watchdog within 60s; PM2 restart restores all jobs; test alert delivered.

**Final acceptance:** 24-hour live paper-mode soak with all four strategies enabled, zero unhandled exceptions in log, heartbeat lag < 2x interval for all strategies, >= 100 decision rows written per strategy.

---

## 8. Open Questions (persisted to `.omc/plans/open-questions.md`)

1. Kalshi API access — does the user have credentials, or do we need to register? Affects S4.2 timeline.
2. NWS / Trading Economics / CoinGecko API tiers — are paid keys available, or strictly free tier? Affects S5.3 rate limits.
3. EMOS calibration history — should we backfill from historical Polymarket settlements, or accept a 30-day cold-start? Affects S4.1 launch date.
4. Decision log retention — confirm 90-day default, or longer for compliance?
5. Telegram alert routing — single chat, or per-strategy channels?
6. PM2 vs systemd — confirm PM2 stays the production supervisor (current state) or migrate?
7. Live mode kill-switch — global env flag, per-strategy, or both?

---

## 9. Success Criteria (Whole Plan)

- All 9 user requirements demonstrably met (one verification per requirement listed in Phase exit gates).
- 24-hour paper-mode soak passes with zero unhandled exceptions.
- `pytest backend/tests && cd frontend && npm run test && npm run build` exits 0.
- Zero `grep` hits for hardcoded tickers, cities, wallets, or thresholds outside `config.py` defaults and seed scripts.
- Every trade row joins to `TradeContext` and at least one `DecisionLog` row.
- Whale leaderboard displays >= 100 wallets with full filter/sort.
- Strategy can be added by dropping a file in `backend/strategies/` and inserting one DB row — no `scheduler.py` edit.
