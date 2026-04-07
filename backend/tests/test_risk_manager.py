import pytest
from unittest.mock import patch
from backend.core.risk_manager import RiskManager, RiskDecision


@pytest.fixture
def rm():
    return RiskManager()


def test_low_confidence_rejected(rm):
    with patch.object(rm, "_daily_loss_exceeded", return_value=False):
        d = rm.validate_trade(size=100, current_exposure=0, bankroll=10000, confidence=0.3)
    assert not d.allowed
    assert "confidence" in d.reason


def test_oversize_trade_clamped(rm):
    with patch.object(rm, "_daily_loss_exceeded", return_value=False):
        d = rm.validate_trade(size=10000, current_exposure=0, bankroll=10000, confidence=0.9)
    assert d.allowed
    assert d.adjusted_size <= 10000 * 0.05 + 1e-6


def test_max_exposure_reached(rm):
    with patch.object(rm, "_daily_loss_exceeded", return_value=False):
        d = rm.validate_trade(size=100, current_exposure=10000 * 0.50, bankroll=10000, confidence=0.9)
    assert not d.allowed


def test_daily_loss_circuit(rm):
    with patch.object(rm, "_daily_loss_exceeded", return_value=True):
        d = rm.validate_trade(size=100, current_exposure=0, bankroll=10000, confidence=0.9)
    assert not d.allowed
    assert "daily loss" in d.reason


def test_slippage_rejection(rm):
    with patch.object(rm, "_daily_loss_exceeded", return_value=False):
        d = rm.validate_trade(size=100, current_exposure=0, bankroll=10000, confidence=0.9, slippage=0.05)
    assert not d.allowed
    assert "slippage" in d.reason
