"""Tests for /api/decisions list, filter, and export endpoints."""
import pytest
from backend.config import settings


class TestDecisionsList:
    def setup_method(self):
        settings.ADMIN_API_KEY = None

    def test_decisions_returns_200(self, client):
        resp = client.get("/api/decisions")
        assert resp.status_code == 200

    def test_decisions_has_items_and_total(self, client):
        resp = client.get("/api/decisions")
        data = resp.json()
        assert "items" in data
        assert "total" in data

    def test_decisions_items_is_list(self, client):
        resp = client.get("/api/decisions")
        data = resp.json()
        assert isinstance(data["items"], list)

    def test_decisions_total_is_int(self, client):
        resp = client.get("/api/decisions")
        data = resp.json()
        assert isinstance(data["total"], int)

    def test_decisions_filter_by_strategy(self, client, db):
        """Seed a decision and filter by strategy."""
        from backend.models.database import DecisionLog
        from datetime import datetime

        # Seed a record
        rec = DecisionLog(
            strategy="copy_trader",
            market_ticker="TEST-MARKET",
            decision="BUY",
            confidence=0.7,
            reason="test",
        )
        db.add(rec)
        db.commit()

        resp = client.get("/api/decisions?strategy=copy_trader")
        data = resp.json()
        assert resp.status_code == 200
        # All returned items belong to copy_trader
        for item in data["items"]:
            assert item["strategy"] == "copy_trader"

    def test_decisions_filter_by_decision(self, client, db):
        """Filter by decision type BUY returns only BUY decisions."""
        from backend.models.database import DecisionLog

        resp = client.get("/api/decisions?decision=BUY")
        data = resp.json()
        assert resp.status_code == 200
        for item in data["items"]:
            assert item["decision"] == "BUY"

    def test_decisions_filter_nonexistent_strategy(self, client):
        """Filtering by a nonexistent strategy returns empty items."""
        resp = client.get("/api/decisions?strategy=nonexistent_xyz_123")
        data = resp.json()
        assert resp.status_code == 200
        assert data["total"] == 0
        assert data["items"] == []


class TestDecisionsExport:
    def setup_method(self):
        settings.ADMIN_API_KEY = None

    def test_export_returns_200(self, client):
        resp = client.get("/api/decisions/export")
        assert resp.status_code == 200

    def test_export_content_type_ndjson(self, client):
        resp = client.get("/api/decisions/export")
        assert "ndjson" in resp.headers.get("content-type", "")

    def test_export_disposition_header(self, client):
        resp = client.get("/api/decisions/export")
        disposition = resp.headers.get("content-disposition", "")
        assert "decisions.jsonl" in disposition
