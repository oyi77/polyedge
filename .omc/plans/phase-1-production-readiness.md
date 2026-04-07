# Phase 1: Production Readiness Implementation Plan

**Plan ID:** `phase-1-prod-readiness`
**Status:** Revised (per Architect/Critic feedback + user request to skip monitoring)
**Created:** 2026-04-07
**Revised:** 2026-04-07
**Target Completion:** 93% complete (from current 88%)

---

## Requirements Summary

PolyEdge trading bot requires 3 production-readiness enhancements to reach 93% completion:

1. **Alembic Database Migrations** — Replace ad-hoc `create_all()` with versioned migrations, capturing all `ensure_schema()` transforms
2. **Comprehensive API Tests** — Expand test coverage to 80%+ for critical paths (Hybrid TDD: write tests first for migrations)
3. **Deployment Documentation** — Complete API docs, ADRs, runbooks, and troubleshooting guides

**Skipped (deferred to Phase 2):**
- Prometheus Metrics Endpoint — Monitoring infrastructure
- Grafana Dashboards — Visualization templates

---

## Acceptance Criteria

### 1. Alembic Migrations (100% Testable)

**Must capture all `ensure_schema()` transforms:**
- [ ] `alembic==1.13.1` added to `/home/openclaw/projects/polyedge/requirements.txt`
- [ ] `alembic init migrations` executed, creating `/home/openclaw/projects/polyedge/backend/migrations/`
- [ ] `alembic.ini` configured with `sqlalchemy.url` from environment variable
- [ ] `env.py` references `backend.models.database.Base.metadata`
- [ ] Initial migration `001_initial_schema.py` generated via `alembic revision --autogenerate -m "Initial schema"`
- [ ] **CRITICAL FIX:** Migration `002_capture_ensure_schema_transforms.py` created with ALL columns from `database.py:256-363`:
  - `trades` table: `event_slug`, `market_type`, `trading_mode`, `strategy`, `signal_source`, `confidence`, `clob_order_id`
  - `bot_state` table: `paper_bankroll`, `paper_pnl`, `paper_trades`, `paper_wins`
  - `signals` table: `actual_outcome`, `outcome_correct`, `settlement_value`, `settled_at`, `market_type`
  - Tables: `copy_trader_entries`, `settlement_events`, `decision_log`, `market_watch`, `wallet_config`, `strategy_config`, `trade_context`
- [ ] **CRITICAL FIX:** Migration `003_add_trades_settled_index.py` created with `CREATE INDEX idx_trades_settled ON trades(settled);`
- [ ] `alembic upgrade head` succeeds on fresh database
- [ ] `alembic downgrade -1` succeeds (rollback test)
- [ ] `init_db()` in `/home/openclaw/projects/polyedge/backend/models/database.py` (line 250) replaced with Alembic call
- [ ] `ensure_schema()` function deprecated with `# DEPRECATED: Use Alembic migrations` comment
- [ ] **VERIFICATION:** Test query `EXPLAIN QUERY PLAN SELECT * FROM trades WHERE settled = 0` uses `idx_trades_settled`
- [ ] CI updated to run `alembic upgrade head` before tests

### 2. Comprehensive API Tests (100% Testable)

**Hybrid TDD approach: Write tests FIRST for migrations (Step 1), then implement:**
- [ ] `/home/openclaw/projects/polyedge/backend/tests/test_strategies/` directory created
- [ ] `test_btc_momentum.py` created with >=3 test cases for `BtcMomentumStrategy`
- [ ] `test_weather_emos.py` created with >=3 test cases for `WeatherEmosStrategy`
- [ ] `test_copy_trader.py` created with >=3 test cases for `CopyTraderStrategy`
- [ ] `/home/openclaw/projects/polyedge/backend/tests/test_integration/` directory created
- [ ] `test_trading_workflow.py` created for end-to-end signal-to-trade flow
- [ ] `test_settlement_workflow.py` created for settlement engine
- [ ] **CRITICAL FIX:** Integration test uses correct endpoint `/api/run-scan` (NOT `/api/admin/scan`)
- [ ] **TDD TESTS FOR STEP 1:** `test_alembic_migrations.py` created BEFORE implementing Alembic:
  - `test_fresh_db_migration()` — verifies `alembic upgrade head` creates correct schema
  - `test_rollback_migration()` — verifies `alembic downgrade -1` works
  - `test_settled_index_exists()` — verifies `idx_trades_settled` index created
- [ ] `pytest --cov=backend --cov-report=term-missing` runs without errors
- [ ] Coverage report shows >=80% for:
  - `backend/strategies/` module
  - `backend/api/main.py` (critical endpoints)
  - `backend/core/signals.py`
  - `backend/core/settlement.py`
- [ ] CI updated to require `--cov-fail-under=80` (from current 60 at line 46 of `.github/workflows/ci.yml`)
- [ ] **RISK ACCEPTANCE STATEMENT:** "Tests are Step 2 (of 3) — late testing risk acknowledged. Mitigation: Hybrid TDD for Step 1 (write tests first). Remaining tests executed before deployment verification."

### 3. Deployment Documentation (100% Testable)
- [ ] `/home/openclaw/projects/polyedge/docs/api/` directory created
- [ ] `/home/openclaw/projects/polyedge/docs/api/openapi.json` generated via FastAPI
- [ ] `/home/openclaw/projects/polyedge/docs/architecture/` directory created
- [ ] `ADR-001-database-migrations.md` created with context, decision, consequences
- [ ] `ADR-002-testing-coverage.md` created documenting 80% target AND TDD approach rationale
- [ ] `/home/openclaw/projects/polyedge/docs/guides/` directory created
- [ ] `deployment.md` created with steps: env setup, migrations, run, verify
- [ ] `troubleshooting.md` created with common issues and solutions
- [ ] README.md updated with links to new docs
- [ ] `/docs` endpoint at FastAPI serves interactive Swagger UI (verify accessible)

---

## Implementation Steps

### Step 1: Alembic Database Migrations (~1.5 hours)

**1.1 Install and configure Alembic**
```bash
cd /home/openclaw/projects/polyedge
echo "alembic==1.13.1" >> requirements.txt
pip install alembic==1.13.1
cd backend
alembic init migrations
```

**1.2 Configure `/home/openclaw/projects/polyedge/backend/migrations/alembic.ini`**
- Modify `sqlalchemy.url` line to use environment variable:
  ```ini
  sqlalchemy.url = ${DATABASE_URL}
  ```

**1.3 Configure `/home/openclaw/projects/polyedge/backend/migrations/env.py`**
- Add import: `from backend.models.database import Base`
- Set `target_metadata = Base.metadata`
- Configure `run_migrations_online()` to use `settings.DATABASE_URL`

**1.4 Create initial migration**
```bash
cd /home/openclaw/projects/polyedge/backend
alembic revision --autogenerate -m "Initial schema"
```

**1.5 **CRITICAL FIX:** Create migration to capture ALL `ensure_schema()` transforms**
```bash
alembic revision -m "Capture ensure_schema transforms"
```

Manually edit the migration to include ALL columns from `database.py:256-363`:
```python
def upgrade():
    # Trades table columns
    op.add_column('trades', sa.Column('event_slug', sa.String(), nullable=True))
    op.add_column('trades', sa.Column('market_type', sa.String(), nullable=True, server_default='btc'))
    op.add_column('trades', sa.Column('trading_mode', sa.String(), nullable=True, server_default='paper'))
    op.add_column('trades', sa.Column('strategy', sa.String(), nullable=True))
    op.add_column('trades', sa.Column('signal_source', sa.String(), nullable=True))
    op.add_column('trades', sa.Column('confidence', sa.Float(), nullable=True))
    op.add_column('trades', sa.Column('clob_order_id', sa.String(), nullable=True))

    # BotState table columns
    op.add_column('bot_state', sa.Column('paper_bankroll', sa.Float(), nullable=False, server_default='10000.0'))
    op.add_column('bot_state', sa.Column('paper_pnl', sa.Float(), nullable=False, server_default='0.0'))
    op.add_column('bot_state', sa.Column('paper_trades', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('bot_state', sa.Column('paper_wins', sa.Integer(), nullable=False, server_default='0'))

    # Signals table columns
    op.add_column('signals', sa.Column('actual_outcome', sa.String(), nullable=True))
    op.add_column('signals', sa.Column('outcome_correct', sa.Boolean(), nullable=True))
    op.add_column('signals', sa.Column('settlement_value', sa.Float(), nullable=True))
    op.add_column('signals', sa.Column('settled_at', sa.DateTime(), nullable=True))
    op.add_column('signals', sa.Column('market_type', sa.String(), nullable=True, server_default='btc'))

    # Create tables that ensure_schema() creates
    op.create_table('copy_trader_entries', ...)
    op.create_table('settlement_events', ...)
    op.create_table('decision_log', ...)
    op.create_table('market_watch', ...)
    op.create_table('wallet_config', ...)
    op.create_table('strategy_config', ...)
    op.create_table('trade_context', ...)

def downgrade():
    # Reverse all changes
    op.drop_table('trade_context')
    op.drop_table('strategy_config')
    # ... etc
    op.drop_column('signals', 'market_type')
    op.drop_column('trades', 'clob_order_id')
    # ... etc
```

**1.6 **CRITICAL FIX:** Create migration for `trades.settled` index**
```bash
alembic revision -m "Add index on trades.settled"
```

Manually edit the migration:
```python
def upgrade():
    op.create_index('idx_trades_settled', 'trades', ['settled'])

def downgrade():
    op.drop_index('idx_trades_settled', 'trades')
```

**1.7 Update `/home/openclaw/projects/polyedge/backend/models/database.py`**
- Replace `init_db()` function (lines 250-253) with:
  ```python
  def init_db():
      """Run Alembic migrations to initialize database."""
      from alembic.config import Config
      from alembic import command
      alembic_cfg = Config("backend/migrations/alembic.ini")
      command.upgrade(alembic_cfg, "head")
  ```

**1.8 **DEPRECATION NOTICE:** Add deprecation comment to `ensure_schema()`**
- At line 256, add: `# DEPRECATED: All schema changes now handled by Alembic migrations. This function kept for backward compatibility during migration period. Remove after all environments migrated.`

**1.9 Update CI workflow**
- Edit `/home/openclaw/projects/polyedge/.github/workflows/ci.yml` line 27-32
- Add before `pytest` step:
  ```yaml
  - name: Run database migrations
    run: alembic upgrade head
  ```

**Acceptance Test:**
```bash
# Fresh database test
rm tradingbot.db
alembic upgrade head
alembic downgrade -1
alembic upgrade head

# Verify index exists
sqlite3 tradingbot.db "EXPLAIN QUERY PLAN SELECT * FROM trades WHERE settled = 0"
# Should show: USING INDEX idx_trades_settled
```

---

### Step 2: Comprehensive API Tests (~2.5 hours)

**Hybrid TDD: Tests written FIRST for Step 1 (migrations). Remaining tests written here.**

**2.1 Create test directories**
```bash
mkdir -p /home/openclaw/projects/polyedge/backend/tests/test_strategies
mkdir -p /home/openclaw/projects/polyedge/backend/tests/test_integration
mkdir -p /home/openclaw/projects/polyedge/backend/tests/test_migrations
```

**2.2 **TDD FOR STEP 1:** Create `/home/openclaw/projects/polyedge/backend/tests/test_migrations/test_alembic.py`**

```python
"""Tests for Alembic migrations - written BEFORE implementation."""
import pytest
from alembic.config import Config
from alembic import command
from sqlalchemy import inspect
import sqlite3
import tempfile
import os


@pytest.fixture
def test_db_path():
    """Create a temporary database for migration testing."""
    fd, path = tempfile.mkstemp(suffix='.db')
    os.close(fd)
    yield path
    os.unlink(path)


@pytest.fixture
def alembic_config(test_db_path):
    """Create Alembic config for test database."""
    from backend.config import settings
    alembic_cfg = Config("backend/migrations/alembic.ini")
    alembic_cfg.set_main_option("sqlalchemy.url", f"sqlite:///{test_db_path}")
    return alembic_cfg


def test_fresh_db_migration(alembic_config, test_db_path):
    """Test that migrations create correct schema on fresh database."""
    command.upgrade(alembic_config, "head")

    # Verify all tables exist
    conn = sqlite3.connect(test_db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = {row[0] for row in cursor.fetchall()}

    required_tables = {
        'trades', 'signals', 'bot_state', 'copy_trader_entries',
        'settlement_events', 'decision_log', 'market_watch',
        'wallet_config', 'strategy_config', 'trade_context',
        'alembic_version'
    }
    assert required_tables.issubset(tables), f"Missing tables: {required_tables - tables}"
    conn.close()


def test_ensure_schema_columns_captured(alembic_config, test_db_path):
    """Test that all ensure_schema() columns were captured in migrations."""
    command.upgrade(alembic_config, "head")

    conn = sqlite3.connect(test_db_path)
    cursor = conn.cursor()

    # Verify trades table has all columns from ensure_schema()
    cursor.execute("PRAGMA table_info(trades)")
    columns = {row[1] for row in cursor.fetchall()}

    required_trades_columns = {
        'event_slug', 'market_type', 'trading_mode', 'strategy',
        'signal_source', 'confidence', 'clob_order_id', 'settled'
    }
    assert required_trades_columns.issubset(columns), f"Missing trades columns: {required_trades_columns - columns}"

    # Verify bot_state has paper tracking columns
    cursor.execute("PRAGMA table_info(bot_state)")
    bot_columns = {row[1] for row in cursor.fetchall()}

    required_bot_columns = {'paper_bankroll', 'paper_pnl', 'paper_trades', 'paper_wins'}
    assert required_bot_columns.issubset(bot_columns), f"Missing bot_state columns: {required_bot_columns - bot_columns}"

    # Verify signals has calibration columns
    cursor.execute("PRAGMA table_info(signals)")
    signal_columns = {row[1] for row in cursor.fetchall()}

    required_signal_columns = {
        'actual_outcome', 'outcome_correct', 'settlement_value',
        'settled_at', 'market_type'
    }
    assert required_signal_columns.issubset(signal_columns), f"Missing signals columns: {required_signal_columns - signal_columns}"

    conn.close()


def test_settled_index_exists(alembic_config, test_db_path):
    """Test that idx_trades_settled index was created."""
    command.upgrade(alembic_config, "head")

    conn = sqlite3.connect(test_db_path)
    cursor = conn.cursor()

    # Check index exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_trades_settled'")
    index_exists = cursor.fetchone() is not None
    assert index_exists, "idx_trades_settled index was not created"

    # Verify index is used in query plan
    cursor.execute("EXPLAIN QUERY PLAN SELECT * FROM trades WHERE settled = 0")
    plan = cursor.fetchall()
    plan_str = str(plan)
    assert 'idx_trades_settled' in plan_str, f"Index not used in query plan: {plan_str}"

    conn.close()


def test_rollback_migration(alembic_config):
    """Test that migrations can be rolled back."""
    command.upgrade(alembic_config, "head")
    command.downgrade(alembic_config, "-1")
    command.upgrade(alembic_config, "head")
    # If we got here, rollback worked
```

**2.3 Create `/home/openclaw/projects/polyedge/backend/tests/test_strategies/__init__.py`**
```python
"""Tests for trading strategies."""
```

**2.4 Create `/home/openclaw/projects/polyedge/backend/tests/test_strategies/test_btc_momentum.py`**
```python
"""Tests for BtcMomentumStrategy."""
import pytest
from backend.strategies.btc_momentum import BtcMomentumStrategy
from backend.strategies.base import StrategyContext, MarketInfo

@pytest.fixture
def strategy():
    return BtcMomentumStrategy()

@pytest.fixture
def mock_context(db):
    from backend.config import settings
    from backend.models.database import SessionLocal

    return StrategyContext(
        db=db,
        clob=None,
        settings=settings,
        logger=logger,
        params={},
        mode="paper"
    )

def test_strategy_name(strategy):
    assert strategy.name == "btc_5m"

def test_strategy_filters_btc_5m_markets(strategy):
    markets = [
        MarketInfo(ticker="BTC-5M-UP", slug="btc-5min-up", category="crypto", end_date=None, volume=1000, liquidity=500),
        MarketInfo(ticker="BTC-1H-UP", slug="btc-1hour-up", category="crypto", end_date=None, volume=1000, liquidity=500),
        MarketInfo(ticker="WEATHER-NYC-HIGH", slug="nyc-temp-high", category="weather", end_date=None, volume=1000, liquidity=500),
    ]
    filtered = asyncio.run(strategy.market_filter(markets))
    assert len(filtered) == 1
    assert "5m" in filtered[0].slug.lower()

def test_run_cycle_logs_experimental_warning(strategy, mock_context, caplog):
    import asyncio
    with caplog.at_level("WARNING"):
        result = asyncio.run(strategy.run_cycle(mock_context))
    assert "EXPERIMENTAL" in caplog.text
    assert result.decisions_recorded >= 0
```

**2.5 Create `/home/openclaw/projects/polyedge/backend/tests/test_strategies/test_weather_emos.py`**
```python
"""Tests for WeatherEmosStrategy."""
import pytest
from backend.strategies.weather_emos import WeatherEmosStrategy, CalibrationState

def test_calibration_state_adds_observation():
    state = CalibrationState()
    assert state.n == 0

    state.add_observation(forecast_mean=70.0, forecast_std=5.0, actual=72.0)
    assert state.n == 1

    state.add_observation(forecast_mean=70.0, forecast_std=5.0, actual=72.0, window=3)
    assert state.n == 2

def test_calibration_state_refits_after_minimum():
    state = CalibrationState()
    # Add 3 observations to trigger refit
    for i in range(3):
        state.add_observation(70.0 + i, 5.0, 71.0 + i)
    assert state.n == 3
    # Should have fitted a and b coefficients
    assert isinstance(state.a, float)
    assert isinstance(state.b, float)

def test_calibration_calibrates_forecast():
    state = CalibrationState()
    # With no observations, returns uncalibrated value
    assert state.calibrate(70.0) == 70.0
```

**2.6 Create `/home/openclaw/projects/polyedge/backend/tests/test_strategies/test_copy_trader.py`**
```python
"""Tests for CopyTraderStrategy."""
import pytest
from backend.strategies.copy_trader import ScoredTrader, WalletTrade

def test_scored_trader_market_diversity():
    trader = ScoredTrader(
        wallet="0x123",
        pseudonym="TestTrader",
        profit_30d=1000.0,
        win_rate=0.6,
        total_trades=20,
        unique_markets=10,
        estimated_bankroll=5000.0
    )
    assert trader.market_diversity == 0.5  # 10/20

def test_scored_trader_zero_division():
    trader = ScoredTrader(
        wallet="0x123",
        pseudonym="TestTrader",
        profit_30d=1000.0,
        win_rate=0.6,
        total_trades=0,
        unique_markets=0,
        estimated_bankroll=5000.0
    )
    assert trader.market_diversity == 0.0
```

**2.7 Create `/home/openclaw/projects/polyedge/backend/tests/test_integration/__init__.py`**
```python
"""Integration tests for end-to-end workflows."""
```

**2.8 **CRITICAL FIX:** Create `/home/openclaw/projects/polyedge/backend/tests/test_integration/test_trading_workflow.py` with CORRECT endpoint**

```python
"""Integration test for signal generation to trade placement."""
import pytest
from fastapi.testclient import TestClient

def test_signal_to_trade_workflow(client):
    # 1. Generate a signal - USE CORRECT ENDPOINT
    resp = client.post("/api/run-scan")  # FIXED: was /api/admin/scan
    assert resp.status_code == 200
    data = resp.json()
    assert "signals_generated" in data

    # 2. Check that signals were recorded
    resp = client.get("/api/signals")
    assert resp.status_code == 200
    signals = resp.json()
    assert isinstance(signals, list)

    # 3. Simulate a trade (in paper mode)
    resp = client.post("/api/trade/simulate", json={
        "signal_ticker": "BTC-5M-UP"
    })
    assert resp.status_code in (200, 404)  # 404 if no signal found
```

**2.9 Create `/home/openclaw/projects/polyedge/backend/tests/test_integration/test_settlement_workflow.py`**
```python
"""Integration test for settlement workflow."""
import pytest
from datetime import datetime, timedelta

def test_pending_trade_settlement(client, db):
    from backend.models.database import Trade

    # Create a pending trade
    trade = Trade(
        signal_id=1,
        market_ticker="TEST-MARKET",
        platform="polymarket",
        direction="up",
        entry_price=0.50,
        size=10.0,
        settled=False,
        result="pending"
    )
    db.add(trade)
    db.commit()

    # Run settlement
    resp = client.post("/api/admin/settle")
    assert resp.status_code == 200

    # Verify trade was settled
    db.refresh(trade)
    # Note: Actual settlement requires market to be expired
```

**2.10 Update CI coverage threshold**
- Edit `/home/openclaw/projects/polyedge/.github/workflows/ci.yml` line 39:
  ```yaml
  --cov-fail-under=80
  ```

**2.11 Run coverage report**
```bash
cd /home/openclaw/projects/polyedge
pytest --cov=backend --cov-report=term-missing --cov-report=html
```

---

### Step 3: Deployment Documentation (~1.5 hours)

**3.1 Create docs directory structure**
```bash
mkdir -p /home/openclaw/projects/polyedge/docs/api
mkdir -p /home/openclaw/projects/polyedge/docs/architecture
mkdir -p /home/openclaw/projects/polyedge/docs/guides
```

**3.2 Generate OpenAPI spec**
```bash
curl http://localhost:8000/openapi.json -o /home/openclaw/projects/polyedge/docs/api/openapi.json
```

**3.3 Create `/home/openclaw/projects/polyedge/docs/architecture/ADR-001-database-migrations.md`**
```markdown
# ADR-001: Database Migrations with Alembic

## Status
Accepted

## Context
Previously, PolyEdge used SQLAlchemy's `Base.metadata.create_all()` for database initialization,
augmented by an ad-hoc `ensure_schema()` function that added columns at runtime.
This approach lacks:
- Version tracking
- Rollback capability
- Explicit migration scripts
- Team collaboration on schema changes

The `ensure_schema()` function (database.py:256-363) added numerous columns across tables:
- `trades`: event_slug, market_type, trading_mode, strategy, signal_source, confidence, clob_order_id
- `bot_state`: paper_bankroll, paper_pnl, paper_trades, paper_wins
- `signals`: actual_outcome, outcome_correct, settlement_value, settled_at, market_type
- Tables: copy_trader_entries, settlement_events, decision_log, market_watch, wallet_config, strategy_config, trade_context

## Decision
Adopt Alembic for versioned database migrations.

**Critical:** Migration `002_capture_ensure_schema_transforms.py` captures ALL `ensure_schema()` transforms.
Migration `003_add_trades_settled_index.py` adds index on `trades.settled` (queried 7+ times in settlement code).

## Consequences
**Positive:**
- Versioned schema changes
- Ability to rollback
- Explicit migration scripts in version control
- Production-safe schema updates
- Index on frequently-filtered `trades.settled` column improves query performance

**Negative:**
- Additional dependency
- Slight increase in deployment complexity
- Migration conflicts to resolve in team settings
- `ensure_schema()` deprecated but kept for backward compatibility during migration period

## Implementation
- Migrations stored in `backend/migrations/versions/`
- Initial migration: `001_initial_schema.py`
- Schema transforms: `002_capture_ensure_schema_transforms.py`
- Performance index: `003_add_trades_settled_index.py`
```

**3.4 Create `/home/openclaw/projects/polyedge/docs/architecture/ADR-002-testing-coverage.md` with TDD rationale**
```markdown
# ADR-002: 80% Test Coverage Target with Hybrid TDD

## Status
Accepted

## Context
Financial software requires high reliability. Current coverage at ~60% leaves gaps in critical paths.

## Decision
Set 80% minimum coverage for all production code paths.

**Hybrid TDD Approach:**
- **Step 1 (Infrastructure):** Write tests FIRST (TDD) for Alembic migrations to catch schema issues early
- **Steps 2-3 (Implementation):** Write tests after implementation (sequential)

**Rationale for Hybrid Approach:**
- TDD for migrations catches schema issues before production
- Full TDD for all 3 steps would add significant overhead
- Late testing risk acknowledged but mitigated by: (a) TDD for critical infrastructure, (b) deployment verification before production release

## Risk Acceptance Statement
"Tests are Step 2 (of 3) — late testing risk acknowledged. Mitigation: Hybrid TDD for Step 1 (write tests first). Remaining tests executed before deployment verification."

## Rationale
- 80% is achievable without diminishing returns
- Covers all critical paths (strategies, settlement, API)
- Leaves 20% flexibility for UI code, test utilities
- TDD for infrastructure ensures production safety

## Enforcement
- CI blocks PRs below 80%
- Focused testing on high-risk modules:
  - `backend/strategies/`
  - `backend/core/signals.py`
  - `backend/core/settlement.py`
  - `backend/api/main.py`
```

**3.5 Create `/home/openclaw/projects/polyedge/docs/guides/deployment.md`**
```markdown
# ADR-003: 80% Test Coverage Target with Hybrid TDD

## Status
Accepted

## Context
Financial software requires high reliability. Current coverage at ~60% leaves gaps in critical paths.

## Decision
Set 80% minimum coverage for all production code paths.

**Hybrid TDD Approach:**
- **Steps 1-2 (Infrastructure):** Write tests FIRST (TDD) to catch issues early
- **Steps 3-5 (Implementation):** Write tests after implementation (sequential)

**Rationale for Hybrid Approach:**
- TDD for migrations/metrics catches schema and query issues before production
- Full TDD for all 5 steps would add significant overhead
- Late testing risk acknowledged but mitigated by: (a) TDD for critical infrastructure, (b) deployment verification before production release

## Risk Acceptance Statement
"Tests are Step 4 (of 5) — late testing risk acknowledged. Mitigation: Hybrid TDD for Steps 1-2 (write tests first). Remaining tests executed before deployment verification."

## Rationale
- 80% is achievable without diminishing returns
- Covers all critical paths (strategies, settlement, API)
- Leaves 20% flexibility for UI code, test utilities
- TDD for infrastructure ensures production safety

## Enforcement
- CI blocks PRs below 80%
- Focused testing on high-risk modules:
  - `backend/strategies/`
  - `backend/core/signals.py`
  - `backend/core/settlement.py`
  - `backend/api/main.py`
```

**3.6 Create `/home/openclaw/projects/polyedge/docs/guides/troubleshooting.md`**
```markdown
# Deployment Guide

## Prerequisites
- Python 3.11+
- PostgreSQL (production) or SQLite (development)
- API keys for selected platforms

## Quick Deploy

### 1. Environment Setup
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 2. Install Dependencies
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Run Migrations
```bash
cd backend
alembic upgrade head
```

### 4. Start Services
```bash
# Backend
uvicorn backend.api.main:app --host 0.0.0.0 --port 8000

# Frontend (separate terminal)
cd frontend
npm run dev
```

### 5. Verify
```bash
curl http://localhost:8000/api/health
curl http://localhost:8000/metrics
```

## Docker Deployment
```bash
docker-compose up -d
```

## Production Considerations
- Use PostgreSQL instead of SQLite
- Set `TRADING_MODE=testnet` before going live
- Configure Telegram alerts for error notifications
- Monitoring (Prometheus/Grafana) deferred to Phase 2
```

**3.7 Update README.md**
```markdown
# Troubleshooting Guide

## Database Issues

### Migration Fails
**Symptom:** `alembic upgrade head` fails with "Table already exists"

**Solution:**
```bash
alembic stamp head
alembic downgrade -1
alembic upgrade head
```

### ensure_schema() Deprecation Warning
**Symptom:** Log shows "ensure_schema() is deprecated"

**Solution:**
- This is expected during migration period
- Function will be removed after all environments migrate to Alembic
- No action needed unless migration fails

### Database Locked
**Symptom:** `sqlite3.OperationalError: database is locked`

**Solution:**
- Check for running processes: `lsof tradingbot.db`
- Restart the application
- Consider PostgreSQL for production

### Slow Queries on trades.settled
**Symptom:** Settlement queries are slow

**Solution:**
- Verify index exists: `EXPLAIN QUERY PLAN SELECT * FROM trades WHERE settled = 0`
- Should show: `USING INDEX idx_trades_settled`
- If not, run: `alembic upgrade head` to create index

## API Issues

### 401 Unauthorized
**Symptom:** `/api/admin` endpoints return 401

**Solution:**
- Set `ADMIN_API_KEY` in `.env`
- Include header: `Authorization: Bearer <ADMIN_API_KEY>`

## Strategy Issues

### No Signals Generated
**Symptom:** `signals_total` counter not incrementing

**Solution:**
- Verify markets are being scanned: `GET /api/markets`
- Check strategy is enabled: `GET /api/admin/strategies`
- Review logs for strategy-specific errors

### Settlement Fails
**Symptom:** Trades stuck in "pending" state

**Solution:**
- Verify market end date has passed
- Check external API connectivity
- Manual settlement: `POST /api/admin/settle`
```

**3.8 Remove ADR-002 and ADR-003 (Prometheus/Grafana references)**
- Add "Monitoring" section with Prometheus/Grafana setup
- Add "Testing" section with coverage report command
- Add "Documentation" section with links to new docs
- Add `/metrics` to API endpoints list with auth note

---

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Alembic migration conflicts on existing database | HIGH | MEDIUM | Create initial migration from current schema; capture all `ensure_schema()` transforms in migration 002; provide manual migration script for existing databases |
| ensure_schema() columns not captured in Alembic | CRITICAL | LOW | TDD test `test_ensure_schema_columns_captured()` verifies all columns migrated; manual review of database.py:256-363 against migration |
| Missing `trades.settled` index causes slow queries | HIGH | MEDIUM | Migration 003 creates index; TDD test `test_settled_index_exists()` verifies; query plan verification in acceptance criteria |
| Test coverage target delays feature development | MEDIUM | MEDIUM | Hybrid TDD: tests first for critical infrastructure (Step 1); remaining tests sequential; risk acknowledged and accepted |
| Documentation becomes stale | MEDIUM | HIGH | Include doc checks in CI; link docs to code comments; add docs review to PR template |

---

## Verification Steps

### Verify Alembic Migrations
```bash
cd /home/openclaw/projects/polyedge/backend
alembic history
alembic upgrade head
sqlite3 tradingbot.db ".schema"
alembic downgrade -1
alembic upgrade head

# Verify ensure_schema() columns captured
sqlite3 tradingbot.db "PRAGMA table_info(trades)" | grep -E "event_slug|market_type|trading_mode|clob_order_id"
sqlite3 tradingbot.db "PRAGMA table_info(bot_state)" | grep -E "paper_bankroll|paper_pnl"
sqlite3 tradingbot.db "PRAGMA table_info(signals)" | grep -E "actual_outcome|outcome_correct"

# Verify settled index
sqlite3 tradingbot.db "EXPLAIN QUERY PLAN SELECT * FROM trades WHERE settled = 0"
# Should show: USING INDEX idx_trades_settled
```
**Success:** All commands complete without errors, all ensure_schema columns present, index used in query plan

### Verify Test Coverage
```bash
pytest --cov=backend --cov-report=term-missing | grep TOTAL
```
**Success:** Coverage >= 80%

### Verify Documentation
```bash
# Test all documentation links
curl -f http://localhost:8000/docs
ls -la docs/architecture/*.md
ls -la docs/guides/*.md

# Verify ADRs include all decisions
grep -l "ensure_schema" docs/architecture/ADR-001-database-migrations.md
grep -l "Hybrid TDD\|Risk Acceptance" docs/architecture/ADR-002-testing-coverage.md
```
**Success:** All files exist, /docs renders, ADRs address all decisions

---

## Estimated Effort

| Step | Estimated Time | Dependencies | Notes |
|------|----------------|--------------|-------|
| 1. Alembic Migrations | 1.5 hours | None | +30 min for ensure_schema capture + index + TDD tests |
| 2. Comprehensive Tests | 2.5 hours | Step 1 | +30 min for TDD tests for Step 1 + endpoint fix |
| 3. Documentation | 1.5 hours | Steps 1-2 | ADRs for migrations and testing |
| **Total** | **5.5 hours** | | Monitoring deferred to Phase 2 |

---

## Success Criteria

Phase 1 is complete when:
1. All acceptance criteria pass (checkboxes checked)
2. `pytest --cov` shows >= 80% coverage
3. All documentation is accessible and accurate
4. CI pipeline passes with updated coverage threshold
5. **ALL CRITICAL FIXES VERIFIED:**
   - `ensure_schema()` transforms captured in Alembic migration
   - `idx_trades_settled` index created and used
   - Integration test uses `/api/run-scan` endpoint
6. **ALL MAJOR FIXES VERIFIED:**
   - TDD tests exist for Step 1 (migrations)
   - Risk acceptance statement included
   - ADR-002 documents Hybrid TDD rationale

---

## Out of Scope (Future Phases)

The following are intentionally excluded from Phase 1:
- **Prometheus Metrics Endpoint** — Monitoring infrastructure (deferred to Phase 2)
- **Grafana Dashboards** — Visualization templates (deferred to Phase 2)
- Redis caching layer
- Background job queuing (Celery/RQ)
- Kubernetes deployment manifests
- Advanced risk management features
- Performance optimization beyond `trades.settled` index
- Log aggregation (ELK/Loki)
- Removal of deprecated `ensure_schema()` function (deferred to Phase 2 after all environments migrated)

These are tracked for Phase 2 and Phase 3 per `IMPLEMENTATION_GAPS.md`.

---

*This revised plan addresses ALL CRITICAL and MAJOR feedback from Architect and Critic. Ready for implementation via `/oh-my-claudecode:start-work phase-1-prod-readiness`.*

---

## RALPLAN-DR Summary

### Principles (Design Philosophy)
1. **Production Safety First** — All changes must be rollbackable; migrations before schema changes; tests before deployment; capture ALL existing schema transforms before deprecating
2. **Test-Driven Quality** — Hybrid TDD approach catches critical infrastructure issues early; 80% coverage ensures reliability for financial software
3. **Documentation Driven Development** — ADRs capture decisions; runbooks reduce on-call anxiety; API docs enable integration
4. **Testable Acceptance Criteria** — Every requirement can be verified via command or assertion; TDD for migrations catches schema issues early
5. **Incremental Progress with Risk Mitigation** — Each of the 3 steps can be completed independently; Hybrid TDD balances speed and safety; late testing risk explicitly acknowledged and mitigated

### Decision Drivers (Top 3)
1. **Time to Production** — Current 88% completion with gaps in migrations and tests blocking deployment
2. **Production Safety** — Need rollback capability (Alembic) and test coverage before trading with real capital; missing indexes unacceptable
3. **Team Scalability** — Documentation and tests enable multiple developers to work safely on the codebase; clear ADRs prevent revisiting settled decisions

### Viable Options

#### Option A: Sequential Implementation with Hybrid TDD (RECOMMENDED)
**Approach:** Complete Steps 1-3 in order, with TDD for Step 1 (migrations) and sequential testing for remaining steps.

**Pros:**
- Clear dependencies: Tests (Step 2) build on migrations (Step 1)
- Natural progression: infrastructure (migrations) → quality (tests) → documentation
- TDD for migrations catches missing indexes, schema gaps early
- Easier to track progress and validate completion
- Lower cognitive load per step

**Cons:**
- Longer time to first "complete" deliverable (5.5 hours total)
- Cannot parallelize work across multiple developers
- Tests for Steps 2-3 come after implementation (acknowledged risk, mitigated by deployment verification)

**Effort:** 5.5 hours total (1.5 + 2.5 + 1.5)

**Risk Mitigation:** TDD for Step 1 catches critical infrastructure issues; deployment verification gates prevent production release until all tests pass.

#### Option B: Parallel Infrastructure + Quality
**Approach:** Split work across two tracks: Infrastructure (Step 1) and Quality/Docs (Steps 2-3), executed in parallel by different developers.

**Pros:**
- Faster calendar time if multiple developers available
- Test failures can inform implementation of migrations
- Reduces risk of late test discoveries

**Cons:**
- Requires coordination on shared code
- Higher risk of merge conflicts
- More complex project management overhead
- Cannot do true TDD if tests and implementation happen simultaneously

**Effort:** 3-4 hours calendar time with 2 developers

#### Option C: Critical Path First
**Approach:** Implement only blocking items (Alembic migrations with all ensure_schema captures, core tests with TDD) immediately; defer full documentation to Phase 2.

**Pros:**
- Unblocks production deployment fastest (~3 hours with critical fixes)
- Allows incremental addition of documentation later
- Lower initial effort

**Cons:**
- Documentation debt accumulates; runbooks become "nice to have" and may never be written
- Violates Principle 3 (Documentation Driven Development)
- Team scalability suffers without clear ADRs and guides

**Invalidation Rationale:** This option was rejected because proper documentation is essential for production systems. While the bot could run with minimal docs, the lack of runbooks, troubleshooting guides, and ADRs increases operational risk and makes onboarding difficult. The 2.5-hour investment in documentation reduces on-call burden and enables team scaling.

### Selected Approach: Option A (Sequential Implementation with Hybrid TDD)

Phase 1 will follow Option A's sequential approach with Hybrid TDD. The 5.5-hour investment is justified by:
1. Each step produces immediately valuable artifacts
2. TDD for Step 1 catches critical issues (missing indexes, schema gaps) early
3. Sequential execution minimizes coordination overhead for a single developer or small team
4. Clear validation gates reduce risk of incomplete work
5. Monitoring deferred to Phase 2 allows focus on production safety fundamentals

### ADR Summary

| Decision | Drivers | Alternatives Rejected | Consequences |
|----------|---------|----------------------|--------------|
| **Alembic for migrations** | Version control, rollback capability, capture ensure_schema() | Manual SQL scripts, SQLAlchemy create_only | Additional dependency; production-safe schema changes; ensure_schema() deprecated |
| **Capture all ensure_schema() transforms** | Missing columns cause runtime errors, data loss | Incremental migrations only | Larger initial migration; complete schema coverage |
| **Index on trades.settled** | Column filtered 7+ times, query performance | No index | Additional index maintenance; faster settlement queries |
| **80% test coverage target** | Financial software reliability, CI enforcement | 60% (current), 95% (diminishing returns) | Slower feature development; higher confidence |
| **Hybrid TDD** | Catch critical infrastructure issues early, balance speed and safety | Full TDD (slower), Full sequential (higher risk) | TDD overhead for Step 1; late testing risk acknowledged for Steps 2-3 |
| **Defer monitoring to Phase 2** | Focus on production safety fundamentals first | Include monitoring in Phase 1 | Faster time to production-ready state; monitoring added when needed |
