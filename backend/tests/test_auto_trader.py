import pytest
from unittest.mock import MagicMock, AsyncMock
from backend.core.auto_trader import AutoTrader
from backend.core.risk_manager import RiskDecision


@pytest.fixture
def rm_allow():
    rm = MagicMock()
    rm.validate_trade.return_value = RiskDecision(True, "ok", 100.0)
    return rm


@pytest.fixture
def rm_reject():
    rm = MagicMock()
    rm.validate_trade.return_value = RiskDecision(False, "rejected", 0.0)
    return rm


@pytest.mark.asyncio
async def test_auto_execute_high_confidence(rm_allow, monkeypatch):
    from backend.config import settings
    monkeypatch.setattr(settings, "TRADING_MODE", "paper")
    monkeypatch.setattr(settings, "AUTO_APPROVE_MIN_CONFIDENCE", 0.85)
    trader = AutoTrader(rm_allow)
    result = await trader.execute_signal(
        {"confidence": 0.9, "size": 100, "market_id": "m1", "side": "BUY"},
        bankroll=10000, current_exposure=0,
    )
    assert result.executed
    assert not result.pending_approval


@pytest.mark.asyncio
async def test_low_confidence_creates_pending(rm_allow, monkeypatch):
    from backend.config import settings
    monkeypatch.setattr(settings, "AUTO_APPROVE_MIN_CONFIDENCE", 0.85)
    trader = AutoTrader(rm_allow)
    result = await trader.execute_signal(
        {"confidence": 0.6, "size": 100, "market_id": "m1", "side": "BUY"},
        bankroll=10000, current_exposure=0,
    )
    assert not result.executed
    assert result.pending_approval


@pytest.mark.asyncio
async def test_risk_rejection(rm_reject):
    trader = AutoTrader(rm_reject)
    result = await trader.execute_signal(
        {"confidence": 0.95, "size": 100, "market_id": "m1"},
        bankroll=10000, current_exposure=0,
    )
    assert not result.executed
    assert not result.pending_approval
    assert "rejected" in result.reason
