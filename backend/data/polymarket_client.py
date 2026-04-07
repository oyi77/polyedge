"""Polymarket API client for fetching market data."""

import aiohttp
import asyncio
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import time


class PolymarketClient:
    """
    Production-grade Polymarket API client with rate limiting and caching.
    """

    BASE_URL = "https://clob.polymarket.com"
    MAX_RETRIES = 3
    RATE_LIMIT = 120  # requests per minute

    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self._semaphore = asyncio.Semaphore(2)  # Max 2 concurrent requests
        self._cache: Dict[str, Any] = {}
        self._cache_ttl: Dict[str, datetime] = {}
        self._request_times: List[float] = []

    async def __aenter__(self):
        self.session = aiohttp.ClientSession(headers={"Accept": "application/json"})
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
            self.session = None

    def _get_cache(self, key: str) -> Optional[Any]:
        if key in self._cache and key in self._cache_ttl:
            if datetime.now() < self._cache_ttl[key]:
                return self._cache[key]
            else:
                del self._cache[key]
                del self._cache_ttl[key]
        return None

    def _set_cache(self, key: str, value: Any, ttl_seconds: int = 60):
        self._cache[key] = value
        self._cache_ttl[key] = datetime.now() + timedelta(seconds=ttl_seconds)

    async def _rate_limit(self):
        now = time.time()
        self._request_times = [t for t in self._request_times if now - t < 60]
        if len(self._request_times) >= self.RATE_LIMIT:
            sleep_time = 60 - (now - self._request_times[0])
            if sleep_time > 0:
                await asyncio.sleep(sleep_time)
        self._request_times.append(time.time())

    async def _request(
        self,
        endpoint: str,
        params: Optional[Dict] = None,
        cache_key: Optional[str] = None,
        cache_ttl: int = 60,
    ) -> Optional[Dict]:
        if cache_key:
            cached = self._get_cache(cache_key)
            if cached:
                return cached

        if not self.session:
            raise RuntimeError("Client not initialized. Use async with context.")

        async with self._semaphore:
            await self._rate_limit()

            url = f"{self.BASE_URL}{endpoint}"

            for attempt in range(self.MAX_RETRIES):
                try:
                    async with self.session.get(url, params=params) as response:
                        if response.status == 429:
                            await asyncio.sleep(2**attempt)
                            continue
                        response.raise_for_status()
                        data = await response.json()

                        if cache_key:
                            self._set_cache(cache_key, data, cache_ttl)

                        return data
                except aiohttp.ClientError as e:
                    if attempt == self.MAX_RETRIES - 1:
                        raise
                    await asyncio.sleep(2**attempt)

        return None

    async def get_active_markets(self, limit: int = 500) -> List[Dict]:
        """Fetch all active markets from Polymarket."""
        cache_key = f"active_markets_{limit}"
        data = await self._request(
            "/markets",
            params={"active": "true", "limit": limit},
            cache_key=cache_key,
            cache_ttl=30,
        )
        return data.get("markets", []) if data else []

    async def get_market(self, market_id: str) -> Optional[Dict]:
        """Get detailed information about a specific market."""
        cache_key = f"market_{market_id}"
        return await self._request(
            f"/markets/{market_id}", cache_key=cache_key, cache_ttl=30
        )

    async def get_market_prices(self, market_id: str) -> Optional[Dict]:
        """Get current prices for a market."""
        cache_key = f"prices_{market_id}"
        return await self._request(
            f"/markets/{market_id}/prices",
            cache_key=cache_key,
            cache_ttl=10,  # Short TTL for prices
        )

    async def get_recent_trades(self, market_id: str, limit: int = 100) -> List[Dict]:
        """Get recent trades for a market."""
        cache_key = f"trades_{market_id}_{limit}"
        data = await self._request(
            f"/markets/{market_id}/trades",
            params={"limit": limit},
            cache_key=cache_key,
            cache_ttl=15,
        )
        return data.get("trades", []) if data else []

    async def get_orderbook(self, market_id: str) -> Optional[Dict]:
        """Get orderbook for a market."""
        cache_key = f"orderbook_{market_id}"
        return await self._request(
            f"/markets/{market_id}/orderbook",
            cache_key=cache_key,
            cache_ttl=5,  # Very short TTL for orderbook
        )

    async def get_all_markets_summary(self) -> List[Dict]:
        """Get summary of all markets (lighter than full markets)."""
        cache_key = "markets_summary"
        data = await self._request(
            "/markets/summary", cache_key=cache_key, cache_ttl=60
        )
        return data if isinstance(data, list) else []

    def clear_cache(self):
        """Clear all cached data."""
        self._cache.clear()
        self._cache_ttl.clear()
