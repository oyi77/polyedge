"""Tests for /api/health, /api/stats, /api/dashboard endpoints."""
import pytest


class TestHealth:
    def test_health_returns_200(self, client):
        resp = client.get("/api/health")
        assert resp.status_code == 200

    def test_health_has_strategies_key(self, client):
        resp = client.get("/api/health")
        data = resp.json()
        assert "strategies" in data

    def test_health_has_bot_running_or_status(self, client):
        resp = client.get("/api/health")
        data = resp.json()
        # health returns status and strategies
        assert "status" in data
        assert data["status"] in ("ok", "degraded")

    def test_health_has_timestamp(self, client):
        resp = client.get("/api/health")
        data = resp.json()
        assert "timestamp" in data


class TestStats:
    def test_stats_returns_200(self, client):
        resp = client.get("/api/stats")
        assert resp.status_code == 200

    def test_stats_has_bankroll(self, client):
        resp = client.get("/api/stats")
        data = resp.json()
        assert "bankroll" in data

    def test_stats_has_paper_and_live(self, client):
        resp = client.get("/api/stats")
        data = resp.json()
        assert "paper" in data
        assert "live" in data

    def test_stats_has_total_trades(self, client):
        resp = client.get("/api/stats")
        data = resp.json()
        assert "total_trades" in data
        assert isinstance(data["total_trades"], int)


class TestDashboard:
    def test_dashboard_returns_200(self, client):
        resp = client.get("/api/dashboard")
        assert resp.status_code == 200

    def test_dashboard_has_stats(self, client):
        resp = client.get("/api/dashboard")
        data = resp.json()
        assert "stats" in data

    def test_dashboard_has_recent_trades(self, client):
        resp = client.get("/api/dashboard")
        data = resp.json()
        assert "recent_trades" in data
        assert isinstance(data["recent_trades"], list)

    def test_dashboard_has_trading_mode(self, client):
        resp = client.get("/api/dashboard")
        data = resp.json()
        assert "trading_mode" in data
