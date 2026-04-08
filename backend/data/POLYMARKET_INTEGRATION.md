# Polymarket Data Integration - Research & Architecture

**Date**: 2026-04-08
**Status**: Production-Ready with Real Data

## Research Summary

### Existing Libraries Evaluated

| Library | Stars | Purpose | Used? |
|---------|-------|---------|-------|
| **py-clob-client** | 1045⭐ | Official CLOB client for trading operations | ✅ Yes (for trading) |
| **polymarket-mcp-server** | 348⭐ | MCP server for AI agents (45 tools) | ⚠️ Patterns only |
| **prediction-market-analysis** | 2774⭐ | Data collection & analysis framework | ❌ Not applicable |
| **poly-maker** | 1008⭐ | Automated market making bot | ❌ Different use case |

### Key Findings

1. **py-clob-client** (Official Polymarket Library)
   - ✅ Excellent for: Trading, order books, price data
   - ❌ Does NOT provide: Leaderboard, top traders, PNL rankings
   - ✅ Installed and ready for future trading features

2. **polymarket-mcp-server** (MCP Server)
   - ✅ Production patterns: Rate limiting, retry logic, error handling
   - ❌ Not a library: It's a complete MCP server for AI agents
   - ✅ Patterns adopted in our scraper

3. **Our Custom Scraper**
   - ✅ **Necessary**: Leaderboard data is NOT available via any library
   - ✅ Uses Next.js endpoint directly (real data, no mock)
   - ✅ Production-ready: Retry logic, error handling, timeouts

## Architecture Decision

### Why Keep Custom Scraper?

**Question**: Can we use only existing libraries?

**Answer**: **NO** - Here's why:

1. **py-clob-client** doesn't provide leaderboard/top-trader data
2. **polymarket-mcp-server** is an MCP server, not a Python library
3. Leaderboard data is only available via Polymarket's Next.js endpoints

### Solution: Hybrid Approach

```
┌─────────────────────────────────────────────────────────┐
│                   PolyEdge Backend                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐        ┌─────────────────────┐   │
│  │ Custom Scraper   │        │  py-clob-client     │   │
│  │                  │        │                     │   │
│  │ • Leaderboard    │        │ • Trading           │   │
│  │ • Market search  │        │ • Order books       │   │
│  │ • Gamma API      │        │ • Price data        │   │
│  └──────────────────┘        └─────────────────────┘   │
│                                                           │
│  Both use:                                                │
│  • Rate limiting (from polymarket-mcp-server)           │
│  • Retry logic with exponential backoff                  │
│  • Proper error handling                                 │
│  • Timeouts and connection management                    │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

### Leaderboard Data (Real-Time)
```
Polymarket Next.js → scraper → API → Frontend
     ↓
  /_next/data/.../leaderboard.json
     ↓
  {pageProps.dehydratedState.queries[0].state.data}
     ↓
  Real trader PNL: $1.8M, $1.7M, $7M+
```

### Market Data (Gamma API)
```
Gamma API → scraper → API → Frontend
     ↓
  /markets?active=true&closed=false
     ↓
  Real prices, volume, liquidity
```

## Production Features

From **polymarket-mcp-server** patterns:

- ✅ **Retry Logic**: 3 attempts with exponential backoff
- ✅ **Rate Limiting**: Handles 429 responses gracefully
- ✅ **Timeout Handling**: 30s default timeout
- ✅ **Error Logging**: Comprehensive error tracking
- ✅ **Context Manager**: Proper resource cleanup

## Installation

```bash
# Official Polymarket CLOB client (for trading)
pip install py-clob-client

# MCP server (patterns only, not imported)
pip install git+https://github.com/caiovicentino/polymarket-mcp-server.git
```

## Usage Example

```python
from backend.data.polymarket_scraper import PolymarketScraper

async def get_leaderboard():
    async with PolymarketScraper() as scraper:
        traders = await scraper.fetch_leaderboard(limit=10)
        # Returns REAL trader data with actual PNL from Polymarket
        for trader in traders:
            print(f"{trader['pseudonym']}: ${trader['profit_30d']:,.2f}")
```

## Future Work

1. **Trading Integration**: Use py-clob-client for order execution
2. **WebSocket**: Real-time price updates (py-clob-client supports this)
3. **Advanced Analytics**: Use prediction-market-analysis dataset (36GB)

## References

- [py-clob-client](https://github.com/Polymarket/py-clob-client) - Official CLOB client
- [polymarket-mcp-server](https://github.com/caiovicentino/polymarket-mcp-server) - MCP server with 45 tools
- [prediction-market-analysis](https://github.com/Jon-Becker/prediction-market-analysis) - Data collection framework

---

**TL;DR**: We use existing libraries where possible (py-clob-client for trading), but custom scraper is necessary for leaderboard data that no library provides. All data is REAL, no mock.
