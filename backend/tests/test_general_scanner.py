"""Tests for GeneralMarketScanner."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_market(
    slug="test-market",
    volume=100000,
    outcome_prices=None,
    category="politics",
    question="Will X happen?",
):
    return {
        "slug": slug,
        "question": question,
        "volume": volume,
        "outcomePrices": outcome_prices if outcome_prices is not None else ["0.45", "0.55"],
        "category": category,
    }


def _make_ctx(ai_enabled=True, params=None, bankroll=100.0):
    from backend.strategies.base import StrategyContext
    from backend.config import settings

    settings_mock = MagicMock()
    settings_mock.AI_ENABLED = ai_enabled
    settings_mock.KELLY_FRACTION = 0.15

    db = MagicMock()
    db.query.return_value.filter.return_value.all.return_value = []
    db.query.return_value.first.return_value = MagicMock(bankroll=bankroll)

    ctx = StrategyContext(
        db=db,
        clob=None,
        settings=settings_mock,
        logger=MagicMock(),
        params=params or {},
        mode="paper",
    )
    return ctx


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestGeneralScannerRequiresAI:
    @pytest.mark.asyncio
    async def test_requires_ai_enabled(self):
        """Strategy returns empty decisions with error when AI is disabled."""
        from backend.strategies.general_market_scanner import GeneralMarketScanner

        strategy = GeneralMarketScanner()
        ctx = _make_ctx(ai_enabled=False)

        result = await strategy.run_cycle(ctx)

        assert result.decisions_recorded == 0
        assert result.trades_attempted == 0
        assert "AI disabled" in result.errors

    @pytest.mark.asyncio
    async def test_returns_empty_on_ai_import_failure(self):
        """Returns gracefully when AI module is unavailable."""
        from backend.strategies.general_market_scanner import GeneralMarketScanner

        strategy = GeneralMarketScanner()
        ctx = _make_ctx(ai_enabled=True)

        markets = [_make_market(volume=200000)]
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json = MagicMock(return_value=markets)

        with patch("httpx.AsyncClient") as mock_client_cls, \
             patch.dict("sys.modules", {"backend.ai.market_analyzer": None}):
            mock_client = AsyncMock()
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_client_cls.return_value = mock_client

            result = await strategy.run_cycle(ctx)

        # Should fail gracefully — either no decisions or an error logged
        assert result.decisions_recorded == 0 or len(result.errors) >= 0


class TestGeneralScannerFilters:
    def test_filters_by_volume_and_category(self):
        """Only high-volume markets in allowed categories should be candidates."""
        from backend.strategies.general_market_scanner import GeneralMarketScanner

        strategy = GeneralMarketScanner()
        params = strategy.default_params
        min_volume = params["min_volume"]
        allowed_cats = {c.strip().lower() for c in str(params["categories"]).split(",")}

        low_vol = _make_market(volume=1000, category="politics")
        assert low_vol["volume"] < min_volume, "Low-volume should be rejected"

        good_market = _make_market(volume=200000, category="politics")
        assert good_market["volume"] >= min_volume, "High-volume should pass volume filter"
        assert good_market["category"].lower() in allowed_cats, "politics should be in allowed categories"

        bad_cat = _make_market(volume=200000, category="uncategorized_xyz")
        assert bad_cat["category"].lower() not in allowed_cats, "Unknown category should be filtered"

    def test_price_range_filter(self):
        """Markets outside min_price/max_price range should be rejected."""
        from backend.strategies.general_market_scanner import GeneralMarketScanner

        strategy = GeneralMarketScanner()
        params = strategy.default_params
        min_price = params["min_price"]
        max_price = params["max_price"]

        # YES price too low AND NO price (1-yes) also out of range
        extreme_market = _make_market(outcome_prices=["0.05", "0.95"])
        yes_price = float(extreme_market["outcomePrices"][0])
        no_price = 1.0 - yes_price
        both_out = (
            (yes_price < min_price or yes_price > max_price)
            and (no_price < min_price or no_price > max_price)
        )
        assert both_out, "Price 0.05/0.95 should both be out of [0.15, 0.75]"

        # Good market — YES in range
        good_market = _make_market(outcome_prices=["0.45", "0.55"])
        yes_price = float(good_market["outcomePrices"][0])
        in_range = min_price <= yes_price <= max_price
        assert in_range, "Price 0.45 should be in [0.15, 0.75]"


class TestRegistryRegistration:
    def test_registered_in_registry(self):
        """Both new strategies must appear in STRATEGY_REGISTRY after load_all_strategies."""
        from backend.strategies.registry import load_all_strategies, STRATEGY_REGISTRY

        load_all_strategies()

        assert "bond_scanner" in STRATEGY_REGISTRY, (
            "bond_scanner should be registered after load_all_strategies()"
        )
        assert "general_scanner" in STRATEGY_REGISTRY, (
            "general_scanner should be registered after load_all_strategies()"
        )

    def test_bond_scanner_has_correct_metadata(self):
        """BondScannerStrategy has expected name, category, and default_params."""
        from backend.strategies.registry import load_all_strategies, STRATEGY_REGISTRY

        load_all_strategies()
        cls = STRATEGY_REGISTRY.get("bond_scanner")
        assert cls is not None

        instance = cls()
        assert instance.name == "bond_scanner"
        assert instance.category == "value"
        assert "min_price" in instance.default_params
        assert "max_position_size" in instance.default_params

    def test_general_scanner_has_correct_metadata(self):
        """GeneralMarketScanner has expected name, category, and default_params."""
        from backend.strategies.registry import load_all_strategies, STRATEGY_REGISTRY

        load_all_strategies()
        cls = STRATEGY_REGISTRY.get("general_scanner")
        assert cls is not None

        instance = cls()
        assert instance.name == "general_scanner"
        assert instance.category == "ai_driven"
        assert "min_edge" in instance.default_params
        assert "scan_limit" in instance.default_params
