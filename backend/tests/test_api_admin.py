"""Tests for /api/admin/settings and /api/admin/system endpoints."""
import pytest
from fastapi.testclient import TestClient


class TestAdminAuth:
    def test_settings_open_when_no_key(self, client):
        """If ADMIN_API_KEY is not set, endpoint is open."""
        from backend.config import settings
        original = settings.ADMIN_API_KEY
        settings.ADMIN_API_KEY = None
        try:
            resp = client.get("/api/admin/settings")
            assert resp.status_code == 200
        finally:
            settings.ADMIN_API_KEY = original

    def test_settings_requires_auth_when_key_set(self, client):
        """If ADMIN_API_KEY is set, unauthenticated requests get 401."""
        from backend.config import settings
        original = settings.ADMIN_API_KEY
        settings.ADMIN_API_KEY = "test-key"
        try:
            resp = client.get("/api/admin/settings")
            assert resp.status_code == 401
        finally:
            settings.ADMIN_API_KEY = original

    def test_settings_accepts_valid_token(self, client):
        """Valid bearer token returns 200."""
        from backend.config import settings
        original = settings.ADMIN_API_KEY
        settings.ADMIN_API_KEY = "test-secret"
        try:
            resp = client.get(
                "/api/admin/settings",
                headers={"Authorization": "Bearer test-secret"},
            )
            assert resp.status_code == 200
        finally:
            settings.ADMIN_API_KEY = original

    def test_system_requires_auth_when_key_set(self, client):
        """GET /api/admin/system needs auth when key is set."""
        from backend.config import settings
        original = settings.ADMIN_API_KEY
        settings.ADMIN_API_KEY = "test-key"
        try:
            resp = client.get("/api/admin/system")
            assert resp.status_code == 401
        finally:
            settings.ADMIN_API_KEY = original


class TestAdminSettings:
    def _admin_client(self, client):
        from backend.config import settings
        settings.ADMIN_API_KEY = "test-secret"
        return client, {"Authorization": "Bearer test-secret"}

    def test_settings_returns_grouped_keys(self, client):
        from backend.config import settings
        original = settings.ADMIN_API_KEY
        settings.ADMIN_API_KEY = "test-secret"
        try:
            resp = client.get(
                "/api/admin/settings",
                headers={"Authorization": "Bearer test-secret"},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert "trading" in data
            assert "api_keys" in data
        finally:
            settings.ADMIN_API_KEY = original

    def test_settings_masks_secrets(self, client):
        from backend.config import settings
        orig_key = settings.ADMIN_API_KEY
        orig_poly = settings.POLYMARKET_API_KEY
        settings.ADMIN_API_KEY = "test-secret"
        settings.POLYMARKET_API_KEY = "real-key"
        try:
            resp = client.get(
                "/api/admin/settings",
                headers={"Authorization": "Bearer test-secret"},
            )
            data = resp.json()
            assert data["api_keys"].get("POLYMARKET_API_KEY") == "****"
        finally:
            settings.ADMIN_API_KEY = orig_key
            settings.POLYMARKET_API_KEY = orig_poly


class TestAdminSystem:
    def test_system_returns_expected_shape(self, client):
        from backend.config import settings
        original = settings.ADMIN_API_KEY
        settings.ADMIN_API_KEY = None
        try:
            resp = client.get("/api/admin/system")
            assert resp.status_code == 200
            data = resp.json()
            assert "trading_mode" in data
            assert "bot_running" in data
        finally:
            settings.ADMIN_API_KEY = original

    def test_system_trading_mode_matches_settings(self, client):
        from backend.config import settings
        original = settings.ADMIN_API_KEY
        settings.ADMIN_API_KEY = None
        try:
            resp = client.get("/api/admin/system")
            data = resp.json()
            assert data["trading_mode"] == settings.TRADING_MODE
        finally:
            settings.ADMIN_API_KEY = original
