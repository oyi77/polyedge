"""Dynamic whale discovery — seeds candidates and computes scores."""
import logging
from typing import List, Optional
from datetime import datetime, timedelta

from backend.models.database import SessionLocal, WalletConfig
from backend.core.whale_scoring import calculate_whale_score

logger = logging.getLogger("trading_bot.whale_discovery")


class WhaleDiscovery:
    async def discover(self, min_trades: int = 10) -> List[dict]:
        """
        Compute whale scores for all WalletConfig rows that have enough trade history.
        Persists score back into WalletConfig.whale_score.

        Returns: list of {wallet, score, trade_count} dicts ordered by score desc.
        """
        results = []
        db = SessionLocal()
        try:
            wallets = db.query(WalletConfig).all()
            for w in wallets:
                history = await self._fetch_history(w.address)
                if len(history) < min_trades:
                    continue
                days = self._estimate_days(history)
                score = calculate_whale_score(history, days_active=days)
                w.whale_score = score
                results.append({
                    "wallet": w.address,
                    "score": score,
                    "trade_count": len(history),
                })
            db.commit()
        finally:
            db.close()
        results.sort(key=lambda r: r["score"], reverse=True)
        return results

    async def _fetch_history(self, wallet: str) -> List[dict]:
        """
        Default implementation returns an empty list (no external calls).
        Override or monkeypatch in tests / production with the Polymarket Data API client.
        """
        return []

    def _estimate_days(self, history: List[dict]) -> float:
        if not history:
            return 1.0
        try:
            timestamps = [h.get("timestamp") for h in history if h.get("timestamp")]
            if not timestamps:
                return 1.0
            spread = max(timestamps) - min(timestamps)
            return max(spread / 86400.0, 1.0)
        except Exception:
            return 1.0
