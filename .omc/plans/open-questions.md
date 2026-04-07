# Open Questions

This file tracks unresolved questions, decisions deferred to the user, and items needing clarification before or during execution.

## Phase 1: Production Readiness - 2026-04-07

### Migration Strategy for Existing Databases
- [ ] **Question:** How should existing `tradingbot.db` files be migrated to Alembic? — Current database has `clob_order_id` column added via `ensure_schema()` (line 357 of `database.py`). Initial migration needs to handle both fresh and existing databases.
  - **Impact:** Affects Step 1.6 implementation
  - **Options:** (1) `alembic stamp head` for existing DBs, (2) Manual migration script, (3) Documented backup/recreate procedure
  - **Default if unresolved:** Use `alembic stamp head` approach with documentation

### Prometheus Metrics Storage Retention
- [ ] **Question:** What retention period for Prometheus metrics in production? — Time-series data storage grows continuously.
  - **Impact:** Affects Step 3.7 Prometheus configuration
  - **Options:** (1) 15 days default, (2) 30 days for analysis, (3) 90 days for seasonal patterns
  - **Default if unresolved:** 15 days (Prometheus default)

### Grafana Dashboard Access Control
- [ ] **Question:** Should Grafana be secured with authentication in production deployments?
  - **Impact:** Affects Step 3.6 docker-compose.yml configuration
  - **Options:** (1) Password auth (admin/admin), (2) OAuth via GitHub/Google, (3) Proxy behind existing auth
  - **Default if unresolved:** Password auth with environment variable override

### Test Coverage Exemptions
- [ ] **Question:** Are any modules exempt from the 80% coverage requirement?
  - **Impact:** Affects Step 4.9 CI configuration
  - **Options:** (1) No exemptions, (2) UI/test utilities exempt, (3) Specific modules listed
  - **Default if unresolved:** No exemptions for `backend/`; frontend tracked separately

### CI Pipeline Resource Limits
- [ ] **Question:** Should CI enforce time limits for test execution?
  - **Impact:** Affects Step 4.9 `.github/workflows/ci.yml` update
  - **Options:** (1) 10 minute timeout, (2) 20 minute timeout, (3) No limit
  - **Default if unresolved:** 20 minute timeout

---

**Instructions:** When a question is resolved, remove it from this file and document the decision in the appropriate ADR or implementation plan.
