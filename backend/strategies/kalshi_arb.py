"""
Kalshi <-> Polymarket Arbitrage Strategy.

Scans for crossed-book opportunities: when Polymarket YES price + Kalshi YES price < 1.0,
there is a guaranteed profit equal to (1 - sum_of_prices) minus fees.

Status: SCAFFOLD — requires KALSHI_API_KEY to activate.
Seeded as enabled=False until credentials are configured.
"""
import logging
from dataclasses import dataclass

from backend.strategies.base import BaseStrategy, StrategyContext, CycleResult, MarketInfo
from backend.core.decisions import record_decision

logger = logging.getLogger("trading_bot")

POLYMARKET_FEE = 0.02   # 2% maker fee
KALSHI_FEE = 0.01       # 1% taker fee
MIN_ARB_EDGE = 0.02     # minimum net edge after fees to fire


@dataclass
class ArbOpportunity:
    poly_ticker: str
    kalshi_ticker: str
    poly_yes_price: float
    kalshi_yes_price: float
    gross_edge: float
    net_edge: float


def compute_arb_edge(poly_yes: float, kalshi_yes: float) -> float:
    """
    Net edge = (1 - poly_yes - kalshi_yes) - fees.
    Positive means guaranteed profit exists.
    """
    gross = 1.0 - poly_yes - kalshi_yes
    fees = POLYMARKET_FEE + KALSHI_FEE
    return gross - fees


class KalshiArbStrategy(BaseStrategy):
    name = "kalshi_arb"
    description = "Kalshi <-> Polymarket arbitrage scanner. Requires KALSHI_API_KEY. Seeded disabled."
    category = "arbitrage"
    default_params = {
        "min_edge": MIN_ARB_EDGE,
        "allow_live_execution": False,
        "interval_seconds": 30,
    }

    async def market_filter(self, markets: list[MarketInfo]) -> list[MarketInfo]:
        """Filter to markets that have a configured Kalshi equivalent."""
        # MarketWatch rows with source='kalshi_arb' define the pairs
        return markets  # full scan — pair matching done in run_cycle

    async def run_cycle(self, ctx: StrategyContext) -> CycleResult:
        result = CycleResult(
            decisions_recorded=0,
            trades_attempted=0,
            trades_placed=0,
        )

        # Gate: check for Kalshi credentials
        kalshi_key = getattr(ctx.settings, "KALSHI_API_KEY", None)
        if not kalshi_key:
            record_decision(
                ctx.db, self.name, "all_markets", "SKIP",
                confidence=0.0,
                signal_data={"reason": "no_credentials"},
                reason="KALSHI_API_KEY not configured — strategy inactive"
            )
            result.decisions_recorded = 1
            return result

        # When credentials are available, scan for arb opportunities
        # (full implementation pending Kalshi API access)
        try:
            opportunities = await self._scan_opportunities(ctx)
            for opp in opportunities:
                min_edge = ctx.params.get("min_edge", MIN_ARB_EDGE)
                decision = "BUY" if opp.net_edge >= min_edge else "SKIP"
                record_decision(
                    ctx.db, self.name, opp.poly_ticker, decision,
                    confidence=min(1.0, opp.net_edge * 10),
                    signal_data={
                        "poly_yes": opp.poly_yes_price,
                        "kalshi_yes": opp.kalshi_yes_price,
                        "gross_edge": opp.gross_edge,
                        "net_edge": opp.net_edge,
                        "kalshi_ticker": opp.kalshi_ticker,
                    },
                    reason=f"arb_edge={opp.net_edge:.3f}"
                )
                result.decisions_recorded += 1
                if decision == "BUY":
                    result.trades_attempted += 1
        except Exception as e:
            result.errors.append(str(e))
            logger.error(f"KalshiArbStrategy error: {e}")

        return result

    async def _scan_opportunities(self, ctx: StrategyContext) -> list[ArbOpportunity]:
        """
        Placeholder: will query Kalshi API for matched markets and compare to Polymarket prices.
        Currently returns empty list until Kalshi credentials and market mapping are configured.
        """
        return []
