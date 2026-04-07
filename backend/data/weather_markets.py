"""Weather temperature market fetcher from Polymarket."""
import json
import re
import logging
from dataclasses import dataclass
from datetime import date
from typing import List, Optional

from backend.core.market_scanner import fetch_markets_by_keywords

logger = logging.getLogger("trading_bot")

# Month name to number
MONTH_MAP = {
    "january": 1, "february": 2, "march": 3, "april": 4,
    "may": 5, "june": 6, "july": 7, "august": 8,
    "september": 9, "october": 10, "november": 11, "december": 12,
    "jan": 1, "feb": 2, "mar": 3, "apr": 4,
    "jun": 6, "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}

_DEFAULT_WEATHER_KEYWORDS = [
    "temperature",
    "weather",
    "degrees fahrenheit",
    "high temperature",
    "low temperature",
]


@dataclass
class WeatherMarket:
    """A weather temperature prediction market."""
    slug: str
    market_id: str
    platform: str
    title: str
    city_key: str
    city_name: str
    target_date: date
    threshold_f: float       # Temperature threshold in Fahrenheit
    metric: str              # "high" or "low"
    direction: str           # "above" or "below"
    yes_price: float         # Price of YES outcome (0-1)
    no_price: float          # Price of NO outcome (0-1)
    volume: float = 0.0
    closed: bool = False


def _parse_weather_market_title(title: str) -> Optional[dict]:
    """
    Parse a weather market title to extract city, threshold, metric, date.

    Handles patterns like:
    - "Will the high temperature in New York exceed 75°F on March 5?"
    - "NYC high temperature above 80°F on March 10, 2026"
    - "Chicago daily high over 60°F on March 3"
    - "Will Miami's low be above 65°F on March 7?"
    - "Temperature in Denver above 70°F on March 5, 2026"
    """
    title_lower = title.lower()

    # Must be temperature-related
    if not any(kw in title_lower for kw in ["temperature", "temp", "°f", "degrees", "high", "low"]):
        return None

    # Extract city by scanning CITY_CONFIG keys/names dynamically
    city_key = None
    city_name = None
    try:
        from backend.data.weather import CITY_CONFIG
        # Build alias map from CITY_CONFIG: check both key and name variants
        candidates = []
        for key, cfg in CITY_CONFIG.items():
            name_lower = cfg["name"].lower()
            candidates.append((name_lower, key, cfg["name"]))
            candidates.append((key.replace("_", " "), key, cfg["name"]))
            candidates.append((key, key, cfg["name"]))
        # Sort longest alias first to prefer specific matches
        candidates.sort(key=lambda x: -len(x[0]))
        for alias, key, name in candidates:
            if alias in title_lower:
                city_key = key
                city_name = name
                break
    except Exception:
        pass

    if not city_key:
        return None

    # Extract threshold temperature
    temp_match = re.search(r'(\d+)\s*°?\s*f', title_lower)
    if not temp_match:
        temp_match = re.search(r'(\d+)\s*degrees', title_lower)
    if not temp_match:
        return None
    threshold_f = float(temp_match.group(1))

    # Determine metric (high vs low)
    metric = "high"  # default
    if "low" in title_lower:
        metric = "low"

    # Determine direction
    direction = "above"  # default
    if any(kw in title_lower for kw in ["below", "under", "less than", "drop below"]):
        direction = "below"

    # Extract date
    target_date = _extract_date(title_lower)
    if not target_date:
        return None

    return {
        "city_key": city_key,
        "city_name": city_name,
        "threshold_f": threshold_f,
        "metric": metric,
        "direction": direction,
        "target_date": target_date,
    }


def _extract_date(text: str) -> Optional[date]:
    """Extract a date from market title text."""
    today = date.today()

    # Build month name pattern for precise matching
    month_names = "|".join(MONTH_MAP.keys())

    # Pattern: "March 5, 2026" or "March 5 2026" or "March 5"
    for match in re.finditer(rf'({month_names})\s+(\d{{1,2}})(?:\s*,?\s*(\d{{4}}))?', text):
        month_str = match.group(1)
        day = int(match.group(2))
        year = int(match.group(3)) if match.group(3) else today.year

        month = MONTH_MAP.get(month_str)
        if month and 1 <= day <= 31:
            try:
                return date(year, month, day)
            except ValueError:
                continue

    # Pattern: "3/5/2026" or "03/05"
    match = re.search(r'(\d{1,2})/(\d{1,2})(?:/(\d{4}))?', text)
    if match:
        month = int(match.group(1))
        day = int(match.group(2))
        year = int(match.group(3)) if match.group(3) else today.year
        try:
            return date(year, month, day)
        except ValueError:
            pass

    return None


async def fetch_polymarket_weather_markets(
    city_keys: Optional[List[str]] = None,
    keywords: Optional[List[str]] = None,
) -> List[WeatherMarket]:
    """
    Search Polymarket for weather temperature markets using keyword-based scanning.
    """
    if keywords is None:
        keywords = _DEFAULT_WEATHER_KEYWORDS

    markets: List[WeatherMarket] = []
    seen_ids: set = set()

    try:
        scanner_results = await fetch_markets_by_keywords(keywords)
        for info in scanner_results:
            market = _parse_scanner_market(info, city_keys)
            if market and market.market_id not in seen_ids:
                seen_ids.add(market.market_id)
                markets.append(market)
    except Exception as e:
        logger.warning(f"Failed to fetch weather markets: {e}")

    logger.info(f"Found {len(markets)} weather temperature markets")
    return markets


def _parse_scanner_market(
    info,
    city_keys: Optional[List[str]] = None,
) -> Optional[WeatherMarket]:
    """Parse a MarketInfo from the scanner into a WeatherMarket if it's a temp market."""
    question = info.question
    if not question:
        return None

    parsed = _parse_weather_market_title(question)
    if not parsed:
        return None

    # Filter by requested cities
    if city_keys and parsed["city_key"] not in city_keys:
        return None

    # Only trade markets for dates in the future (or today)
    if parsed["target_date"] < date.today():
        return None

    yes_price = info.yes_price
    no_price = info.no_price

    # Skip near-resolved markets
    if yes_price > 0.98 or yes_price < 0.02:
        return None

    return WeatherMarket(
        slug=info.slug,
        market_id=info.ticker,
        platform="polymarket",
        title=question,
        city_key=parsed["city_key"],
        city_name=parsed["city_name"],
        target_date=parsed["target_date"],
        threshold_f=parsed["threshold_f"],
        metric=parsed["metric"],
        direction=parsed["direction"],
        yes_price=yes_price,
        no_price=no_price,
        volume=info.volume,
    )
