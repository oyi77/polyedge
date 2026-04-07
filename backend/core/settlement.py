"""Trade settlement logic for BTC 5-min and weather markets using Polymarket API."""

import asyncio
import json
import logging
import re
from datetime import datetime
from typing import Optional, List, Tuple

import httpx
from cachetools import TTLCache
from sqlalchemy.orm import Session

from backend.models.database import (
    Trade,
    BotState,
    Signal,
    SettlementEvent,
    TradeContext,
)

logger = logging.getLogger("trading_bot")

# Module-level: track consecutive 404s per market_id (bounded TTLCache: 1000 entries, 1 hour TTL)
_market_404_counts: TTLCache = TTLCache(maxsize=1000, ttl=3600)


async def fetch_polymarket_resolution(
    market_id: str, event_slug: Optional[str] = None
) -> Tuple[bool, Optional[float]]:
    """
    Fetch actual market resolution from Polymarket API.

    For BTC 5-min markets, uses event slug to find the market.

    Returns: (is_resolved, settlement_value)
        - settlement_value: 1.0 if Up won, 0.0 if Down won
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Try event slug first (more reliable for BTC 5-min markets)
            if event_slug:
                response = await client.get(
                    "https://gamma-api.polymarket.com/events",
                    params={"slug": event_slug},
                )
                response.raise_for_status()
                events = response.json()

                if events:
                    event = events[0] if isinstance(events, list) else events
                    markets = event.get("markets", [])
                    if markets:
                        return _parse_market_resolution(markets[0])

            # Fallback: try market ID directly
            url = f"https://gamma-api.polymarket.com/markets/{market_id}"
            response = await client.get(url)

            if response.status_code == 404:
                _market_404_counts[market_id] = _market_404_counts.get(market_id, 0) + 1
                if _market_404_counts[market_id] >= 3:
                    logger.debug(f"Skipping market {market_id} — 3+ consecutive 404s")
                    return False, None
                return await _search_market_in_events(market_id)

            response.raise_for_status()
            market = response.json()
            return _parse_market_resolution(market)

    except Exception as e:
        logger.warning(f"Failed to fetch resolution for {event_slug or market_id}: {e}")
        return False, None


async def _search_market_in_events(market_id: str) -> Tuple[bool, Optional[float]]:
    """Search for market in events (both active and closed)."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            for closed in [True, False]:
                params = {"closed": str(closed).lower(), "limit": 200}
                response = await client.get(
                    "https://gamma-api.polymarket.com/events", params=params
                )
                response.raise_for_status()
                events = response.json()

                for event in events:
                    for market in event.get("markets", []):
                        if str(market.get("id")) == str(market_id):
                            return _parse_market_resolution(market)

        return False, None

    except Exception as e:
        logger.warning(f"Failed to search for market {market_id}: {e}")
        return False, None


def _parse_market_resolution(market: dict) -> Tuple[bool, Optional[float]]:
    """
    Parse market data to determine if resolved and outcome.

    Handles both Yes/No and Up/Down outcomes.
    - outcomePrices[0] > 0.99 -> first outcome won (Yes or Up)
    - outcomePrices[0] < 0.01 -> second outcome won (No or Down)
    """
    is_closed = market.get("closed", False)

    if not is_closed:
        return False, None

    outcome_prices = market.get("outcomePrices", [])
    if not outcome_prices:
        return False, None

    try:
        if isinstance(outcome_prices, str):
            outcome_prices = json.loads(outcome_prices)

        first_price = float(outcome_prices[0]) if outcome_prices else 0.5

        if first_price > 0.99:
            # First outcome won (Up or Yes)
            logger.info(f"Market {market.get('id')} resolved: UP/YES won")
            return True, 1.0
        elif first_price < 0.01:
            # Second outcome won (Down or No)
            logger.info(f"Market {market.get('id')} resolved: DOWN/NO won")
            return True, 0.0
        else:
            return False, None

    except (ValueError, IndexError, TypeError) as e:
        logger.warning(f"Failed to parse outcome prices: {e}")
        return False, None


def calculate_pnl(trade: Trade, settlement_value: float) -> float:
    """
    Calculate P&L for a trade given the settlement value.

    settlement_value: 1.0 if Up/Yes outcome, 0.0 if Down/No outcome

    Maps up->yes, down->no internally:
    - UP position wins when settlement = 1.0
    - DOWN position wins when settlement = 0.0
    """
    # Map up/down to yes/no logic
    direction = trade.direction
    if direction == "up":
        direction = "yes"
    elif direction == "down":
        direction = "no"

    if direction == "yes":
        if settlement_value == 1.0:
            pnl = trade.size * (1.0 - trade.entry_price)
        else:
            pnl = -trade.size * trade.entry_price
    else:  # NO / DOWN position
        if settlement_value == 0.0:
            pnl = trade.size * (1.0 - trade.entry_price)
        else:
            pnl = -trade.size * trade.entry_price

    return round(pnl, 2)


async def check_market_settlement(
    trade: Trade,
) -> Tuple[bool, Optional[float], Optional[float]]:
    """
    Check if a trade's market has settled.

    Returns: (is_settled, settlement_value, pnl)
    """
    is_resolved, settlement_value = await fetch_polymarket_resolution(
        trade.market_ticker, event_slug=trade.event_slug
    )

    if not is_resolved or settlement_value is None:
        return False, None, None

    pnl = calculate_pnl(trade, settlement_value)

    mapped_dir = "UP" if trade.direction in ("up", "yes") else "DOWN"
    outcome = "UP" if settlement_value == 1.0 else "DOWN"
    result = "WIN" if mapped_dir == outcome else "LOSS"

    logger.info(
        f"Trade {trade.id} settled: {mapped_dir} @ {trade.entry_price:.0%} -> "
        f"{result} P&L: ${pnl:+.2f}"
    )

    return True, settlement_value, pnl


async def check_weather_settlement(
    trade: Trade,
) -> Tuple[bool, Optional[float], Optional[float]]:
    """
    Check if a weather trade's market has settled.
    Routes to the correct platform's resolution method.
    """
    platform = getattr(trade, "platform", "polymarket") or "polymarket"

    if platform == "kalshi":
        is_resolved, settlement_value = await _fetch_kalshi_resolution(
            trade.market_ticker
        )
    else:
        is_resolved, settlement_value = await fetch_polymarket_resolution(
            trade.market_ticker,
            event_slug=trade.event_slug,
        )

    if is_resolved and settlement_value is not None:
        pnl = calculate_pnl(trade, settlement_value)
        return True, settlement_value, pnl

    return False, None, None


async def _fetch_kalshi_resolution(ticker: str) -> Tuple[bool, Optional[float]]:
    """Fetch resolution status for a Kalshi market."""
    try:
        from backend.data.kalshi_client import KalshiClient, kalshi_credentials_present

        if not kalshi_credentials_present():
            return False, None

        client = KalshiClient()
        data = await client.get_market(ticker)
        market = data.get("market", data)

        status = market.get("status", "")
        result = market.get("result", "")

        if status in ("finalized", "determined") and result:
            if result == "yes":
                return True, 1.0
            elif result == "no":
                return True, 0.0

        return False, None

    except Exception as e:
        logger.warning(f"Failed to fetch Kalshi resolution for {ticker}: {e}")
        return False, None


async def _resolve_markets(
    normal_tickers: set,
    weather_tickers: set,
    trade_slugs: dict,
    trade_platforms: dict,
) -> dict:
    """
    Resolve all unique market tickers concurrently.

    Returns a dict mapping ticker -> (is_resolved, settlement_value).
    normal_tickers: set of tickers for BTC/standard markets.
    weather_tickers: set of tickers for weather markets.
    trade_slugs: dict mapping ticker -> event_slug (may be None).
    trade_platforms: dict mapping ticker -> platform string.
    """

    async def _resolve_one(ticker: str, is_weather: bool):
        platform = trade_platforms.get(ticker, "polymarket") or "polymarket"
        if is_weather and platform == "kalshi":
            result = await _fetch_kalshi_resolution(ticker)
        else:
            result = await fetch_polymarket_resolution(
                ticker, event_slug=trade_slugs.get(ticker)
            )
        return ticker, result

    tasks = [_resolve_one(t, False) for t in normal_tickers] + [
        _resolve_one(t, True) for t in weather_tickers
    ]
    gathered = await asyncio.gather(*tasks, return_exceptions=True)

    resolutions = {}
    for item in gathered:
        if isinstance(item, Exception):
            logger.error(f"Market resolution error: {item}")
            continue
        ticker, result = item
        resolutions[ticker] = result
    return resolutions


async def settle_pending_trades(db: Session) -> List[Trade]:
    """
    Process all pending trades for settlement.
    Uses REAL market outcomes from Polymarket API.
    Deduplicates API calls: each unique market_ticker is resolved once.
    """
    try:
        pending = db.query(Trade).filter(not Trade.settled).all()
    except Exception as e:
        logger.error(f"Failed to query pending trades: {e}")
        return []

    if not pending:
        logger.info("No pending trades to settle")
        return []

    # Mark stale trades (unsettled for >7 days) as expired
    from datetime import timedelta

    now = datetime.utcnow()
    stale_threshold = now - timedelta(days=7)

    expired_count = 0
    for trade in pending:
        if trade.timestamp and trade.timestamp < stale_threshold:
            trade.settled = True
            trade.result = "expired"
            trade.settlement_time = now
            expired_count += 1

    if expired_count > 0:
        db.commit()
        logger.info(f"Marked {expired_count} stale trades as expired")

    # Separate weather vs normal trades and collect unique tickers
    normal_tickers: set = set()
    weather_tickers: set = set()
    trade_slugs: dict = {}
    trade_platforms: dict = {}

    for trade in pending:
        market_type = getattr(trade, "market_type", "btc") or "btc"
        ticker = trade.market_ticker
        trade_slugs[ticker] = getattr(trade, "event_slug", None)
        trade_platforms[ticker] = (
            getattr(trade, "platform", "polymarket") or "polymarket"
        )
        if market_type == "weather":
            weather_tickers.add(ticker)
        else:
            normal_tickers.add(ticker)

    unique_tickers = normal_tickers | weather_tickers
    logger.info(
        f"Settlement: {len(pending)} trades across {len(unique_tickers)} markets "
        f"(saved {len(pending) - len(unique_tickers)} API calls)"
    )

    resolutions = await _resolve_markets(
        normal_tickers, weather_tickers, trade_slugs, trade_platforms
    )

    def _settlement_from_resolution(trade) -> tuple:
        ticker = trade.market_ticker
        if ticker not in resolutions:
            return False, None, None
        is_resolved, settlement_value = resolutions[ticker]
        if not is_resolved or settlement_value is None:
            return False, None, None
        pnl = calculate_pnl(trade, settlement_value)
        market_type = getattr(trade, "market_type", "btc") or "btc"
        if market_type != "weather":
            mapped_dir = "UP" if trade.direction in ("up", "yes") else "DOWN"
            outcome = "UP" if settlement_value == 1.0 else "DOWN"
            result = "WIN" if mapped_dir == outcome else "LOSS"
            logger.info(
                f"Trade {trade.id} settled: {mapped_dir} @ {trade.entry_price:.0%} -> "
                f"{result} P&L: ${pnl:+.2f}"
            )
        return True, settlement_value, pnl

    results = [(t, _settlement_from_resolution(t)) for t in pending]

    settled_trades = []
    for item in results:
        if isinstance(item, Exception):
            logger.error(f"Settlement error: {item}")
            continue
        trade, (is_settled, settlement_value, pnl) = item
        if is_settled and settlement_value is not None:
            trade.settled = True
            trade.settlement_value = settlement_value
            trade.pnl = pnl
            trade.settlement_time = datetime.utcnow()
            if pnl is not None and pnl > 0:
                trade.result = "win"
            elif pnl is not None and pnl < 0:
                trade.result = "loss"
            else:
                trade.result = "push"
            settled_trades.append(trade)
            try:
                from backend.api.main import _broadcast_event

                _broadcast_event(
                    "trade_settled",
                    {
                        "trade_id": trade.id,
                        "market_ticker": trade.market_ticker,
                        "result": trade.result,
                        "pnl": trade.pnl,
                        "mode": getattr(trade, "trading_mode", "paper"),
                    },
                )
            except Exception:
                pass
            platform = getattr(trade, "platform", "polymarket") or "polymarket"
            resolved_outcome = "up" if settlement_value == 1.0 else "down"
            db.add(
                SettlementEvent(
                    trade_id=trade.id,
                    market_ticker=trade.market_ticker,
                    resolved_outcome=resolved_outcome,
                    pnl=pnl,
                    source=platform,
                )
            )
            # Backfill DecisionLog outcome for this trade
            try:
                from backend.models.database import DecisionLog

                outcome = (
                    "WIN"
                    if trade.result == "win"
                    else ("LOSS" if trade.result == "loss" else "PUSH")
                )
                # Try to get strategy from TradeContext
                trade_ctx = (
                    db.query(TradeContext)
                    .filter(TradeContext.trade_id == trade.id)
                    .first()
                )
                dl_query = db.query(DecisionLog).filter(
                    DecisionLog.market_ticker == trade.market_ticker,
                    DecisionLog.outcome == None,
                    DecisionLog.decision == "BUY",
                )
                if trade_ctx and trade_ctx.strategy:
                    dl_query = dl_query.filter(
                        DecisionLog.strategy == trade_ctx.strategy
                    )
                decisions = dl_query.all()
                for decision in decisions:
                    decision.outcome = outcome
            except Exception as e:
                logger.debug(
                    f"DecisionLog outcome backfill failed for {trade.market_ticker}: {e}"
                )

            if trade.signal_id:
                linked_signal = (
                    db.query(Signal).filter(Signal.id == trade.signal_id).first()
                )
                if linked_signal:
                    actual_outcome = "up" if settlement_value == 1.0 else "down"
                    linked_signal.actual_outcome = actual_outcome
                    linked_signal.outcome_correct = (
                        linked_signal.direction == actual_outcome
                    )
                    linked_signal.settlement_value = settlement_value
                    linked_signal.settled_at = datetime.utcnow()
                    market_type = getattr(trade, "market_type", "btc") or "btc"
                    if market_type == "weather" and linked_signal.sources:
                        _try_calibrate_weather(linked_signal, settlement_value)

    if settled_trades:
        try:
            db.commit()
            logger.info(f"Settled {len(settled_trades)} trades")
        except Exception as e:
            logger.error(f"Failed to commit settlements: {e}")
            db.rollback()
            return []
    else:
        logger.info("No trades ready for settlement (markets still open)")

    return settled_trades


async def update_bot_state_with_settlements(
    db: Session, settled_trades: List[Trade]
) -> None:
    """Update bot state with P&L from settled trades."""
    if not settled_trades:
        return

    try:
        state = db.query(BotState).first()
        if not state:
            logger.warning("Bot state not found")
            return

        for trade in settled_trades:
            if trade.pnl is not None:
                trading_mode = getattr(trade, "trading_mode", "paper") or "paper"
                if trading_mode == "paper":
                    state.paper_pnl = (state.paper_pnl or 0.0) + trade.pnl
                    state.paper_bankroll = (state.paper_bankroll or 10000.0) + trade.pnl
                    state.paper_trades = (state.paper_trades or 0) + 1
                    if trade.result == "win":
                        state.paper_wins = (state.paper_wins or 0) + 1
                else:
                    state.total_pnl += trade.pnl
                    state.bankroll += trade.pnl
                    if trade.result == "win":
                        state.winning_trades += 1

        db.commit()
        logger.info(
            f"Updated bot state: Bankroll ${state.bankroll:.2f}, P&L ${state.total_pnl:+.2f}"
        )
    except Exception as e:
        logger.error(f"Failed to update bot state: {e}")
        db.rollback()


async def _get_actual_temp_from_openmeteo(
    city_key: str, target_date: str
) -> Optional[float]:
    try:
        from backend.data.weather import CITY_CONFIG

        cfg = CITY_CONFIG.get(city_key, {})
        lat = cfg.get("lat")
        lon = cfg.get("lon")
        if not lat or not lon:
            return None

        import httpx

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://archive-api.open-meteo.com/v1/archive",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "start_date": target_date,
                    "end_date": target_date,
                    "daily": "temperature_2m_max"
                    if cfg.get("metric") != "low"
                    else "temperature_2m_min",
                },
            )
            if resp.status_code != 200:
                return None
            data = resp.json()
            daily = data.get("daily", {})
            temps = daily.get("temperature_2m_max") or daily.get("temperature_2m_min")
            if temps and len(temps) > 0:
                return float(temps[0])
    except Exception:
        pass
    return None


def _try_calibrate_weather(signal, settlement_value: float) -> None:
    try:
        from backend.core.calibration import update_calibration

        sources = signal.sources or []
        city_key = next(
            (s.split(":", 1)[1] for s in sources if s.startswith("city:")),
            None,
        )
        if not city_key:
            return

        m = re.search(r"Ensemble:\s*([\d.]+)F", signal.reasoning or "")
        if not m:
            return
        forecast_temp_f = float(m.group(1))

        m2 = re.search(r"(?:above|below)\s*([\d.]+)F", signal.reasoning)
        threshold_f = float(m2.group(1)) if m2 else forecast_temp_f

        target_date_match = re.search(
            r"on\s+(\d{4}-\d{2}-\d{2})", signal.reasoning or ""
        )
        actual_temp_f = None

        if target_date_match:
            target_date = target_date_match.group(1)
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                actual_temp_f = loop.run_until_complete(
                    _get_actual_temp_from_openmeteo(city_key, target_date)
                )
            finally:
                loop.close()

        if actual_temp_f is None:
            direction_above = "above" in (signal.reasoning or "").lower().split("|")[0]
            if settlement_value == 1.0:
                actual_temp_f = (
                    threshold_f + 1.0 if direction_above else threshold_f - 1.0
                )
            else:
                actual_temp_f = (
                    threshold_f - 1.0 if direction_above else threshold_f + 1.0
                )

        update_calibration(
            city_key,
            source="gefs",
            forecast_temp_f=forecast_temp_f,
            actual_temp_f=actual_temp_f,
        )
        logger.debug(
            f"Calibration updated: {city_key} forecast={forecast_temp_f:.1f} actual≈{actual_temp_f:.1f}"
        )

    except Exception as e:
        logger.debug(f"Calibration update skipped (best-effort): {e}")
