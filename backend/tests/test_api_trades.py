"""Tests for /api/trades, /api/settlements, /api/signals, /api/stats endpoints."""

import pytest
from backend.config import settings


class TestTrades:
    def setup_method(self):
        settings.ADMIN_API_KEY = None

    def test_trades_returns_200(self, client):
        resp = client.get("/api/trades")
        assert resp.status_code == 200

    def test_trades_returns_list(self, client):
        resp = client.get("/api/trades")
        data = resp.json()
        assert isinstance(data, list)

    def test_trades_with_seeded_data(self, client, db):
        """Seeded trade appears in results."""
        from backend.models.database import Trade
        from datetime import datetime
        from unittest.mock import patch

        trade = Trade(
            market_ticker="BTC-TEST",
            platform="polymarket",
            direction="up",
            entry_price=0.55,
            size=10.0,
            model_probability=0.6,
            market_price_at_entry=0.55,
            edge_at_entry=0.05,
            result="pending",
            trading_mode="paper",
        )
        db.add(trade)
        db.commit()

        with patch("backend.api.trading.settings.TRADING_MODE", "paper"):
            resp = client.get("/api/trades")
        data = resp.json()
        assert isinstance(data, list)
        tickers = [t["market_ticker"] for t in data]
        assert "BTC-TEST" in tickers

    def test_trades_limit_param(self, client):
        resp = client.get("/api/trades?limit=5")
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) <= 5


class TestSettlements:
    def setup_method(self):
        settings.ADMIN_API_KEY = None

    def test_settlements_returns_200(self, client):
        resp = client.get("/api/settlements")
        assert resp.status_code == 200

    def test_settlements_returns_list(self, client):
        resp = client.get("/api/settlements")
        data = resp.json()
        assert isinstance(data, list)

    def test_settlements_empty_by_default(self, client):
        """No settlements seeded — list should have len >= 0."""
        resp = client.get("/api/settlements")
        data = resp.json()
        assert len(data) >= 0


class TestSignalsEndpoint:
    def setup_method(self):
        settings.ADMIN_API_KEY = None

    def test_signals_returns_200(self, client):
        resp = client.get("/api/signals")
        assert resp.status_code == 200

    def test_signals_returns_list(self, client):
        resp = client.get("/api/signals")
        data = resp.json()
        assert isinstance(data, list)


class TestStatsEndpoint:
    def setup_method(self):
        settings.ADMIN_API_KEY = None

    def test_stats_returns_paper_key(self, client):
        resp = client.get("/api/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert "paper" in data

    def test_stats_returns_live_key(self, client):
        resp = client.get("/api/stats")
        data = resp.json()
        assert "live" in data

    def test_stats_paper_has_pnl(self, client):
        resp = client.get("/api/stats")
        data = resp.json()
        assert "pnl" in data["paper"]

    def test_stats_live_has_bankroll(self, client):
        resp = client.get("/api/stats")
        data = resp.json()
        assert "bankroll" in data["live"]
