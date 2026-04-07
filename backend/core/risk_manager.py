"""Risk manager — validates trades against position size, exposure, and confidence rules."""
import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from backend.config import settings
from backend.models.database import SessionLocal, Trade
from sqlalchemy import func

logger = logging.getLogger("trading_bot.risk")


@dataclass
class RiskDecision:
    allowed: bool
    reason: str
    adjusted_size: float


class RiskManager:
    def __init__(self, settings_obj=None):
        self.s = settings_obj or settings

    def validate_trade(
        self,
        size: float,
        current_exposure: float,
        bankroll: float,
        confidence: float,
        slippage: Optional[float] = None,
    ) -> RiskDecision:
        if confidence < 0.5:
            return RiskDecision(False, f"confidence {confidence:.2f} below 0.5", 0.0)

        if self._daily_loss_exceeded():
            return RiskDecision(False, "daily loss limit hit", 0.0)

        max_position = bankroll * self.s.MAX_POSITION_FRACTION
        adjusted = min(size, max_position)

        max_exposure = bankroll * self.s.MAX_TOTAL_EXPOSURE_FRACTION
        if current_exposure + adjusted > max_exposure:
            adjusted = max(0.0, max_exposure - current_exposure)
            if adjusted <= 0:
                return RiskDecision(False, "max exposure reached", 0.0)

        if slippage is not None and slippage > self.s.SLIPPAGE_TOLERANCE:
            return RiskDecision(False, f"slippage {slippage:.4f} > tolerance", 0.0)

        return RiskDecision(True, "ok", adjusted)

    def _daily_loss_exceeded(self) -> bool:
        db = SessionLocal()
        try:
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            daily_pnl = db.query(func.coalesce(func.sum(Trade.pnl), 0.0)).filter(
                Trade.settled == True,
                Trade.settlement_time >= today_start,
            ).scalar() or 0.0
            return daily_pnl <= -self.s.DAILY_LOSS_LIMIT
        except Exception:
            return False
        finally:
            db.close()
