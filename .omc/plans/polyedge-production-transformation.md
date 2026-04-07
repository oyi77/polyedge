# PolyEdge Production Transformation Plan
## From Static Bot to AI-Powered Trading System

**Version:** 1.0  
**Date:** April 7, 2026  
**Status:** Planning Phase  
**Estimated Duration:** 3-4 Months  
**Priority:** P0 (Critical) - Current system non-viable vs competitors

---

## Executive Summary

PolyEdge currently operates as a basic BTC 5-minute prediction market bot with weather-based signals. Competitor analysis reveals production bots generating $40K+ profits through real-time data feeds, ML prediction engines, and sub-second execution. This plan transforms PolyEdge into a competitive AI-powered trading system.

**Current State:** Static rule-based bot with manual execution  
**Target State:** Real-time AI-driven autonomous trading platform  
**Critical Gap:** 60-120s polling vs 1-11s competitor response times

---

## Phase 1: Foundation Fixes (Week 1-2)

### 1.1 Data Consistency Resolution
**Problem:** Bankroll displays $100 in some areas, $10.6K in others

**Root Causes:**
- `INITIAL_BANKROLL` config = $100 (Telegram/command-line use)
- `paper_bankroll` default = $10,000 (paper trading mode)
- Dashboard uses `stats.bankroll` (raw BotState)
- StatsCards uses `stats.paper.bankroll` (mode-aware)

**Implementation:**
- File: `backend/api/main.py` - Unify get_stats() to always return mode-aware values
- File: `frontend/src/components/StatsCards.tsx` - Remove conditional logic
- File: `frontend/src/pages/Dashboard.tsx` - Update Key Metrics section

**Acceptance Criteria:**
- [ ] All components show consistent bankroll value
- [ ] Mode switch updates all displays immediately
- [ ] Paper mode shows $10K, Live mode shows actual bankroll

---

### 1.2 Architecture Foundation
**Problem:** Monolithic single-market design

**Refactoring Tasks:**
```
backend/core/
├── signals.py → Split into:
│   ├── base_signals.py (abstract base)
│   ├── btc_signals.py (current BTC logic)
│   └── market_scanner.py (multi-market support)
├── settlement.py → Add real-time P&L tracking
└── websocket_manager.py (NEW - WebSocket support)

backend/data/
├── Add polymarket_api.py (official API client)
├── Add polygon_listener.py (blockchain websocket)
└── Add news_feeds.py (RSS/news aggregation)
```

---

## Phase 2: Real-Time Data Infrastructure (Week 2-4)

### 2.1 Polymarket API Integration
**Data Sources to Implement:**

| Source | Endpoint | Frequency | Purpose |
|--------|----------|-----------|---------|
| Polymarket REST API | /markets | Real-time | Market metadata |
| Polymarket REST API | /prices | Real-time | Current odds |
| Polymarket REST API | /trades | Real-time | Recent trades |
| Polymarket CLOB | Orderbook | WebSocket | Depth + liquidity |

**Files:**
```
backend/data/
├── polymarket_client.py (NEW)
├── polymarket_websocket.py (NEW)
├── rate_limiter.py (NEW)
└── cache_manager.py (NEW - Redis/memory cache)
```

**Acceptance Criteria:**
- [ ] Fetch all active markets (< 2s latency)
- [ ] Real-time price updates via WebSocket
- [ ] Rate limiting prevents API bans
- [ ] Cache reduces redundant calls by 80%

---

### 2.2 Polygon Blockchain Monitoring
**Purpose:** Detect whale transactions in real-time

**Implementation:**
```python
# backend/data/polygon_listener.py

class PolygonListener:
    """
    Monitors Polygon blockchain for Polymarket transactions
    - WebSocket connection to Polygon RPC
    - Filter for ConditionalTokens contract
    - Parse PositionID for market identification
    - Real-time alerts on large trades
    """
    
    Config:
    - RPC_ENDPOINT: wss://polygon-mainnet.g.alchemy.com/v2/{KEY}
    - CONTRACT: 0x4D97... (ConditionalTokens)
    - MIN_TRADE_USD: $1000 (whale threshold)
```

**Files:**
```
backend/data/polygon_listener.py
backend/models/database.py (add WhaleTransaction model)
```

**Acceptance Criteria:**
- [ ] Detect trades within 5 seconds of blockchain confirmation
- [ ] Calculate USD value accurately (using price oracles)
- [ ] Identify market from PositionID
- [ ] Alert on trades > $1000

---

### 2.3 News & Data Feed Aggregation
**Purpose:** Timezone arbitrage and sentiment signals

**Data Sources:**
```python
FEEDS = {
    "rss": [
        "https://feeds.bbci.co.uk/news/rss.xml",
        "https://feeds.reuters.com/reuters/businessNews",
        "https://www.federalreserve.gov/feeds/press_all.xml",
    ],
    "twitter": ["@elonmusk", "@realDonaldTrump", "@Polymarket"],
    "government": [
        "https://www.congress.gov/rss/all-bills.xml",
    ],
    "crypto": [
        "https://cointelegraph.com/rss",
        "https://coindesk.com/arc/outboundfeeds/rss/",
    ]
}
```

**Files:**
```
backend/data/feed_aggregator.py
backend/ai/sentiment_analyzer.py
```

**Acceptance Criteria:**
- [ ] Process 100+ news sources
- [ ] Sentiment analysis < 2s per article
- [ ] Correlation with active markets
- [ ] Alert on high-impact events

---

## Phase 3: Market Expansion (Week 4-6)

### 3.1 Multi-Market Scanner
**Current:** BTC 5-min only  
**Target:** All Polymarket active markets

**Implementation:**
```python
class MarketScanner:
    """
    Scans all Polymarket markets for trading opportunities
    - Categorizes markets (Politics, Crypto, Sports, etc.)
    - Calculates edge for each market
    - Filters by liquidity and volume
    """
    
    Categories:
    - POLITICS: Elections, policy votes
    - CRYPTO: BTC, ETH, altcoin events
    - SPORTS: Game outcomes, player props
    - ECONOMICS: Fed rates, inflation, GDP
    - TECH: Product launches, earnings
    - ENTERTAINMENT: Awards, celebrity events
```

**Files:**
```
backend/core/market_scanner.py (NEW)
backend/core/market_classifier.py (NEW)
backend/models/database.py (add MarketCategory model)
```

**Acceptance Criteria:**
- [ ] Scan 500+ active markets
- [ ] Categorize with 95% accuracy
- [ ] Rank opportunities by edge score
- [ ] Filter out illiquid markets

---

### 3.2 Whale Wallet Discovery
**Current:** Static wallet list  
**Target:** Dynamic whale discovery and ranking

**Algorithm:**
```python
def calculate_whale_score(wallet):
    """Scoring from competitor analysis"""
    trades = get_trade_history(wallet)
    
    win_rate = len([t for t in trades if t.pnl > 0]) / len(trades)
    total_roi = sum(t.pnl for t in trades) / sum(t.size for t in trades)
    avg_trade_size = sum(t.size for t in trades) / len(trades)
    trade_frequency = len(trades) / days_active
    
    # Weighted score
    score = (
        win_rate * 0.35 +
        min(total_roi / 0.5, 1.0) * 0.30 +
        min(avg_trade_size / 10000, 1.0) * 0.20 +
        min(trade_frequency / 5, 1.0) * 0.15
    )
    
    return score
```

**Files:**
```
backend/core/whale_discovery.py (NEW)
backend/core/whale_scoring.py (NEW)
backend/models/database.py (add WhaleWallet model)
```

**Acceptance Criteria:**
- [ ] Discover 1000+ whale wallets
- [ ] Calculate accurate historical P&L
- [ ] Rank by profitability
- [ ] Update scores daily

---

## Phase 4: AI/ML Strategy Engine (Week 6-10)

### 4.1 ML Prediction Model
**Purpose:** Replace weather-based signals with ML-driven predictions

**Architecture:**
```python
class PredictionEngine:
    """
    ML-based prediction engine for market outcomes
    - Multi-modal inputs: price, volume, sentiment, whale activity
    - Ensemble model: LSTM + XGBoost + Transformers
    - Real-time inference
    """
    
    Features:
    - Market features: price history, volume, liquidity
    - Whale features: recent whale trades, concentration
    - Sentiment features: news sentiment, social buzz
    - Time features: hour of day, day of week, event proximity
    - External features: correlated markets, spot prices
```

**Files:**
```
backend/ai/prediction_engine.py
backend/ai/training/
├── data_collector.py
├── feature_engineering.py
├── model_trainer.py
└── model_evaluator.py
```

**Acceptance Criteria:**
- [ ] 60%+ prediction accuracy (vs 50% random)
- [ ] < 100ms inference time
- [ ] Calibrated confidence scores
- [ ] Daily model retraining

---

### 4.2 Auto-Trading Engine
**Purpose:** Execute trades automatically with approval workflow

**Implementation:**
```python
class AutoTrader:
    """
    Autonomous trading execution
    - Signal generation from PredictionEngine
    - Risk management and position sizing
    - Auto-approval workflow for high-confidence trades
    - Execution via Polymarket CLOB API
    """
    
    Config:
    - AUTO_APPROVE_MIN_CONFIDENCE: 0.85
    - MAX_POSITION_SIZE: 5% of bankroll
    - MAX_TOTAL_EXPOSURE: 50% of bankroll
    - SLIPPAGE_TOLERANCE: 2%
```

**Files:**
```
backend/core/auto_trader.py (NEW)
backend/core/risk_manager.py (NEW)
backend/core/execution_engine.py (NEW)
backend/api/main.py (add auto-trade endpoints)
```

**Acceptance Criteria:**
- [ ] Auto-execute trades > 85% confidence
- [ ] Approval workflow for lower confidence
- [ ] Position sizing respects risk limits
- [ ] Execution latency < 5 seconds

---

### 4.3 Arbitrage Detection
**Purpose:** Find risk-free profit opportunities

**Implementation:**
```python
class ArbitrageDetector:
    """
    Detects arbitrage opportunities across markets
    - Cross-market arbitrage (same event, different prices)
    - Correlated market arbitrage (related events)
    - CLOB spread capture
    """
    
    Opportunities:
    1. Direct Arbitrage: Same event on Polymarket vs Kalshi
    2. Correlated Arbitrage: YES + NO < 95% = arbitrage
    3. Spread Capture: Buy at bid, sell at ask
```

**Acceptance Criteria:**
- [ ] Detect arbitrage within 10 seconds
- [ ] Calculate profit after fees
- [ ] Auto-execute if profit > 1.5%
- [ ] Track arbitrage performance

---

## Phase 5: Real-Time UI & Monitoring (Week 8-10)

### 5.1 Live Dashboard Redesign
**Current:** Static polling dashboard  
**Target:** Real-time trading terminal

**Implementation:**
```
frontend/src/
├── components/
│   ├── LiveMarketView.tsx (NEW)
│   ├── WhaleActivityFeed.tsx (NEW)
│   ├── OpportunityScanner.tsx (NEW)
│   └── TradeExecutionPanel.tsx (NEW)
├── hooks/
│   ├── useWebSocket.ts (NEW)
│   ├── useLiveMarkets.ts (NEW)
│   └── useWhaleTracker.ts (NEW)
└── pages/
    ├── TradingTerminal.tsx (NEW)
    └── MarketAnalysis.tsx (NEW)
```

**Acceptance Criteria:**
- [ ] WebSocket updates < 1s latency
- [ ] Price changes animate smoothly
- [ ] Whale trades show popup alerts
- [ ] Responsive on mobile

---

### 5.2 Mobile Experience
**Implementation:**
- PWA support (service worker)
- Push notifications for whale alerts
- Mobile-optimized trading interface
- Enhanced Telegram bot commands

**Files:**
```
frontend/public/manifest.json
frontend/src/sw.ts
backend/bot/telegram_bot.py (enhance)
```

---

## Phase 6: Production Deployment (Week 10-12)

### 6.1 Infrastructure
```
Infrastructure:
├── Docker Compose
│   ├── app (FastAPI)
│   ├── worker (Celery)
│   ├── redis (caching)
│   ├── postgres (primary DB)
│   └── timescaledb (time-series data)
├── Kubernetes (production)
│   - Horizontal pod autoscaling
│   - Load balancing
│   - Health checks
└── Monitoring
    ├── Prometheus (metrics)
    ├── Grafana (dashboards)
    └── Sentry (error tracking)
```

### 6.2 Testing & QA
- Unit tests (>80% coverage)
- Integration tests (API + DB)
- E2E tests (Playwright)
- Load tests (1000 concurrent users)
- Security audit

---

## Technical Architecture

### System Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React + WebSocket  ←────→  Trading Terminal UI            │
│  Real-time updates          Mobile PWA                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ WebSocket / REST
                     │
┌────────────────────▼────────────────────────────────────────┐
│                        BACKEND                               │
│  FastAPI Server                                              │
│  ├── API Endpoints (REST + WebSocket)                       │
│  ├── Auto-Trading Engine                                    │
│  ├── Risk Management                                        │
│  └── ML Prediction Engine                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌──────────┐ ┌──────────┐ ┌──────────────┐
│ Polymarket│ │ Polygon  │ │  Data Feeds  │
│ API/CLOB  │ │Blockchain│ │ RSS/News/API │
└──────────┘ └──────────┘ └──────────────┘
        │            │            │
        └────────────┼────────────┘
                     │
                     ▼
        ┌────────────────────┐
        │   DATA LAYER       │
        │  PostgreSQL        │
        │  Redis (cache)     │
        │  TimescaleDB       │
        └────────────────────┘
```

---

## Implementation Schedule

| Week | Focus | Key Deliverables |
|------|-------|------------------|
| 1 | Foundation | Data consistency fix, architecture refactoring |
| 2 | Data Infrastructure | Polymarket API client, caching layer |
| 3 | Blockchain | Polygon listener, whale detection |
| 4 | Feeds | News aggregation, sentiment analysis |
| 5 | Multi-Market | Market scanner, categorization |
| 6 | Whale Discovery | Wallet ranking, performance tracking |
| 7 | ML Setup | Feature engineering, model training |
| 8 | Prediction Engine | Inference pipeline, confidence scoring |
| 9 | Auto-Trading | Execution engine, risk management |
| 10 | Arbitrage | Cross-market detection, auto-execution |
| 11 | UI/UX | Real-time dashboard, mobile optimization |
| 12 | Production | Deployment, monitoring, documentation |

---

## Success Metrics

### Technical Metrics
- [ ] API latency < 200ms (p95)
- [ ] WebSocket latency < 1s
- [ ] Blockchain detection < 5s
- [ ] System uptime > 99.9%
- [ ] ML inference < 100ms

### Trading Metrics
- [ ] Prediction accuracy > 60%
- [ ] Average trade latency < 5s
- [ ] Risk-adjusted returns (Sharpe > 1.0)
- [ ] Max drawdown < 20%
- [ ] Win rate > 55%

### Business Metrics
- [ ] Whale wallets tracked: 1000+
- [ ] Active markets monitored: 500+
- [ ] Daily trades automated: 50+
- [ ] User retention: >80% after 30 days

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| API rate limits | High | Medium | Implement caching, backoff |
| Model overfitting | Medium | High | Cross-validation, paper trading |
| Smart contract bugs | Low | Critical | Audit, gradual rollout |
| Market volatility | High | High | Position sizing, stop losses |
| Competition | High | Medium | Feature differentiation |

---

## Cost Estimation

| Component | Monthly Cost |
|-----------|--------------|
| VPS/Hosting | $100-200 |
| Polygon RPC | $50-100 |
| Database | $50-100 |
| ML Inference | $100-200 |
| Monitoring | $20-50 |
| **Total** | **$320-650/mo** |

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Prioritize phases** based on resources
3. **Set up development environment** (Docker)
4. **Begin Phase 1** (Foundation fixes)
5. **Schedule weekly reviews** to track progress

---

**Document Status:** COMPREHENSIVE PLAN COMPLETE  
**Next Action:** User review and approval to proceed  
**Plan Location:** `.sisyphus/plans/polyedge-production-transformation.md`
