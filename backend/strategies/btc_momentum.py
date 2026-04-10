"""
BTC 5-Minute Momentum Strategy (EXPERIMENTAL — DISABLED).

WARNING: This strategy has documented negative live EV: 4W/11L, -49.5% ROI
with technical indicators on binary 5-min markets. Do NOT enable in live mode
without comprehensive re-validation.

This wrapper preserves the existing logic for paper-mode research only.
For production BTC trading, use btc_oracle strategy instead.
"""
import logging

from backend.strategies.base import BaseStrategy, StrategyContext, CycleResult, MarketInfo
from backend.core.decisions import record_decision

logger = logging.getLogger("trading_bot")

EXPERIMENTAL_WARNING = (
    "EXPERIMENTAL — documented -49.5% live ROI on 4W/11L sample. "
    "Do not enable in live mode without re-validation."
)


class BtcMomentumStrategy(BaseStrategy):
    name = "btc_momentum"
    description = f"BTC 5-min momentum (EXPERIMENTAL). {EXPERIMENTAL_WARNING}"
    category = "experimental"
    default_params = {
        "WARNING": EXPERIMENTAL_WARNING,
        "interval_seconds": 60,
        "max_trades_per_scan": 2,
        "max_trade_fraction": 0.03,
    }

    async def market_filter(self, markets: list[MarketInfo]) -> list[MarketInfo]:
        """Filter to BTC 5-min binary markets."""
        return [
            m for m in markets
            if "btc" in m.slug.lower() and "5m" in m.slug.lower()
        ]

    async def run_cycle(self, ctx: StrategyContext) -> CycleResult:
        result = CycleResult(
            decisions_recorded=0,
            trades_attempted=0,
            trades_placed=0,
        )

        # Log experimental warning on every cycle
        logger.warning(f"BtcMomentumStrategy: {EXPERIMENTAL_WARNING}")

        try:
            # Delegate to existing scan logic
            from backend.core.signals import scan_for_signals
            signals = await scan_for_signals()
            actionable = [s for s in signals if s.passes_threshold]

            for signal in actionable:
                decision = "BUY" if signal.passes_threshold else "SKIP"
                market_id = getattr(signal.market, "market_id", "unknown")
                record_decision(
                    ctx.db, self.name,
                    market_id,
                    decision,
                    confidence=getattr(signal, "edge", 0.0),
                    signal_data={
                        "direction": signal.direction,
                        "model_probability": signal.model_probability,
                        "market_probability": signal.market_probability,
                        "edge": signal.edge,
                        "btc_price": getattr(signal, "btc_price", None),
                        "experimental_warning": True,
                    },
                    reason=f"btc_momentum edge={getattr(signal, 'edge', 0):.3f} [EXPERIMENTAL]"
                )
                result.decisions_recorded += 1
                if decision == "BUY":
                    result.trades_attempted += 1
                    result.decisions.append({
                        "decision": "BUY",
                        "market_ticker": market_id,
                        "direction": signal.direction,
                        "confidence": getattr(signal, "edge", 0.0),
                        "edge": signal.edge,
                        "size": None,
                        "entry_price": signal.market_probability,
                        "suggested_size": None,
                        "model_probability": signal.model_probability,
                        "market_probability": signal.market_probability,
                        "platform": "polymarket",
                        "strategy_name": self.name,
                        "experimental_warning": True,
                    })

        except Exception as e:
            result.errors.append(str(e))
            logger.error(f"BtcMomentumStrategy error: {e}")

        return result
