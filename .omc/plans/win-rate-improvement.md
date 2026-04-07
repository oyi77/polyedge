# PolyEdge Win Rate Improvement Plan

**Date:** 2026-04-07
**Baseline:** 54.8% win rate on 74 BTC 5-min paper trades
**Target:** ≥60% win rate with better risk-adjusted returns
**Approach:** Three phased tiers — additive signals first, then weighting reform, then structural overhaul

---

## Context

The current signal engine in `backend/core/signals.py` is a 5-indicator weighted composite
scaled to a narrow `[0.35, 0.65]` probability range, with a fixed 2% edge threshold and $75
hard cap. This plan traces every improvement to exact code locations and provides testable
acceptance criteria for each step.

---

## Phase 1 — High Impact, Low Risk (Additive Only)

**Goal:** Add new signal sources without touching existing weights or thresholds.
**Mechanism:** All Phase 1 changes are strictly additive. Existing behavior is unchanged if
the new signals are inconclusive. Target: +3–5% win rate.

---

### Step 1.1 — Order Book Imbalance as a 6th Indicator

**Files:** `backend/core/signals.py`, `backend/data/polymarket_clob.py`

**Problem:**
`PolymarketCLOB.get_order_book()` (polymarket_clob.py:171) is fully functional and returns
bid/ask depth with prices and sizes, but is never called during signal generation.
`generate_btc_signal()` (signals.py:123) calls only `compute_btc_microstructure()` and
constructs its composite from the 5 existing indicators. The order book is the most direct
short-term predictor: heavy bid-side depth relative to ask-side means buyers are absorbing
offers — a genuine UP signal with a 1–2 minute lag before it reflects in price.

**What to build:**

1. In `generate_btc_signal()`, after computing `micro` (signals.py:134), open a shared
   `PolymarketCLOB` context and call `get_order_book(market.token_id_up)` to get the YES
   (UP) token book.
2. Compute imbalance: `imbalance = (total_bid_size - total_ask_size) / (total_bid_size + total_ask_size)`.
   This yields a value in `[-1, +1]`. Positive = buy pressure = UP signal.
3. Derive `book_signal = max(-1.0, min(1.0, imbalance * 3))` (scale factor 3 gives a
   meaningful signal at typical ±30% imbalances).
4. Add `book_signal` to `indicator_signs` list (signals.py:184) so it participates in
   convergence voting (now 3/5 instead of 2/4 — adjust threshold accordingly).
5. Add `book_signal * WEIGHT_ORDER_BOOK` to the composite (signals.py:198–204).
6. Add `WEIGHT_ORDER_BOOK: float = 0.15` to `config.py` and reduce `WEIGHT_MOMENTUM`
   from `0.35` to `0.20` to keep weights summing to 1.0.

**Acceptance criterion:**
- `generate_btc_signal()` logs `"order_book imbalance=+0.XX"` in its reasoning string on
  every call.
- With a live or paper run of ≥20 trades, the order book indicator appears in signal
  reasoning and the overall edge distribution shifts (mean absolute edge > 2.5%).
- Unit test in `tests/test_signal_engine.py`: mock `get_order_book` to return a book with
  2× bid depth vs ask depth; assert `book_signal > 0` and composite shifts UP.

**Effort:** Medium (requires wiring async CLOB call into signal generation; cache the book
per-market to avoid extra latency)

**Expected mechanism:** Order book imbalance is a leading indicator with 60–120s predictive
horizon — exactly the window of BTC 5-min Polymarket contracts. It directly removes trades
where our other indicators agree but the market microstructure disagrees.

---

### Step 1.2 — Bollinger Band Signal

**Files:** `backend/data/crypto.py`, `backend/core/signals.py`, `backend/config.py`

**Problem:**
60 one-minute candles are fetched (crypto.py:186) but `compute_btc_microstructure()` only
uses them for RSI, momentum lookbacks, VWAP (30-candle window), SMA(5/15), and volatility.
Bollinger Bands are not computed despite the data being present. BB breakouts catch momentum
continuation; BB mean reversion at the bands catches exhausted moves — both relevant to
5-min outcomes.

**What to build:**

1. In `compute_btc_microstructure()` (crypto.py:181), after computing `sma15` (crypto.py:224),
   compute a 20-period Bollinger Band:
   ```python
   bb_period = 20
   bb_closes = closes[-bb_period:]
   bb_mean = sum(bb_closes) / bb_period
   bb_std = math.sqrt(sum((c - bb_mean) ** 2 for c in bb_closes) / bb_period)
   bb_upper = bb_mean + 2 * bb_std
   bb_lower = bb_mean - 2 * bb_std
   bb_pct_b = (current_price - bb_lower) / (bb_upper - bb_lower) if (bb_upper - bb_lower) > 0 else 0.5
   ```
   Add `bb_pct_b` to `BtcMicrostructure` dataclass (crypto.py:27).

2. In `generate_btc_signal()` (signals.py:123), derive signal:
   - `bb_pct_b < 0.1`: price near lower band = oversold = UP signal
   - `bb_pct_b > 0.9`: price near upper band = overbought = DOWN signal
   - Linear interpolation in between: `bb_signal = max(-1.0, min(1.0, (0.5 - bb_pct_b) * 4))`
3. Add `bb_signal` to convergence voting and composite with `WEIGHT_BB: float = 0.10`
   in config.py. Reduce `WEIGHT_SMA` from `0.15` to `0.10` since SMA is partly redundant
   with BB mean.

**Acceptance criterion:**
- `BtcMicrostructure` has `bb_pct_b` field populated on every fetch.
- Signal reasoning logs `BB%B:0.XX` on every call.
- Unit test: with closes all at the upper band boundary, `bb_signal` is strongly negative
  (DOWN), confirming the overbought interpretation.

**Effort:** Small (pure computation on existing candle data, no new API calls)

**Expected mechanism:** BB adds a second mean-reversion signal orthogonal to RSI. When both
RSI and BB agree the price is extended, the composite will exceed the edge threshold more
cleanly, filtering out marginal trades where only one indicator fires.

---

### Step 1.3 — MACD Signal

**Files:** `backend/data/crypto.py`, `backend/core/signals.py`, `backend/config.py`

**Problem:**
MACD (12/26/9 EMA) is the canonical trend-change detector. Current momentum signals
(`momentum_1m`, `momentum_5m`, `momentum_15m`) at crypto.py:207–209 are raw percentage
changes, which are noisy. MACD histogram detects when momentum is accelerating or
decelerating — a cleaner trend-reversal signal than raw % change.

**What to build:**

1. Add `_compute_ema(closes, period)` helper in crypto.py (after `_compute_rsi` at line 156):
   ```python
   def _compute_ema(closes: List[float], period: int) -> float:
       if not closes:
           return 0.0
       k = 2.0 / (period + 1)
       ema = closes[0]
       for price in closes[1:]:
           ema = price * k + ema * (1 - k)
       return ema
   ```

2. In `compute_btc_microstructure()` after volatility calculation (crypto.py:239):
   ```python
   ema12 = _compute_ema(closes, 12)
   ema26 = _compute_ema(closes, 26)
   macd_line = ema12 - ema26
   # Signal line: 9-period EMA of macd_line (approximate with last 9 values)
   macd_values = [_compute_ema(closes[:i], 12) - _compute_ema(closes[:i], 26)
                  for i in range(max(1, len(closes)-8), len(closes)+1)]
   macd_signal_line = _compute_ema(macd_values, 9)
   macd_histogram = macd_line - macd_signal_line
   ```
   Add `macd_histogram: float = 0.0` to `BtcMicrostructure` (crypto.py:27).

3. In `generate_btc_signal()`, derive:
   `macd_signal = max(-1.0, min(1.0, macd_histogram / (micro.price * 0.0005)))`
   (normalize by 0.05% of price as a "full signal" reference). Add to convergence voting
   and composite with `WEIGHT_MACD: float = 0.10` in config.py. Reduce `WEIGHT_RSI` from
   `0.20` to `0.15` since RSI and MACD are both mean-reversion/trend signals.

**Acceptance criterion:**
- `BtcMicrostructure` has `macd_histogram` populated.
- Signal reasoning logs `MACD_hist:±X.XX` on every call.
- Unit test: with a sustained uptrend close sequence, `macd_histogram > 0` and
  `macd_signal > 0`.

**Effort:** Small (pure calculation, no new API calls)

**Expected mechanism:** MACD crossovers have historically been the most reliable single
indicator for short-term trend continuation. Adding it as a confirming vote reduces false
convergence where RSI, VWAP, and SMA all agree but the trend is already reversing.

---

### Step 1.4 — Raise Volume Filter

**Files:** `backend/config.py`, `backend/data/btc_markets.py` (filter call site)

**Problem:**
`MIN_MARKET_VOLUME: float = 100.0` (config.py:70). Markets with $100 volume have spreads
of 10–30 cents on a binary that should be worth 50c. High slippage in low-volume markets
creates systematic losses regardless of signal quality: even if model prob is correct, you
pay 5–15c of spread to enter and another 5–15c to exit.

**What to build:**

1. Change `MIN_MARKET_VOLUME: float = 100.0` → `MIN_MARKET_VOLUME: float = 1000.0`
   in config.py:70.
2. Confirm the filter is applied: grep the codebase for the call site in `btc_markets.py`
   that uses `MIN_MARKET_VOLUME`. If it is not enforced there, add a filter in
   `scan_for_signals()` (signals.py:290) before the `generate_btc_signal` loop:
   ```python
   markets = [m for m in markets if m.volume >= settings.MIN_MARKET_VOLUME]
   ```

**Acceptance criterion:**
- No trade is executed on any market with volume < $1,000 (verifiable in DB trades table).
- `scan_for_signals()` logs how many markets were filtered by volume (add a log line).
- Paper run of 20 trades: all executed trades have volume ≥ $1,000 in their market metadata.

**Effort:** Small (one config line change + one filter line)

**Expected mechanism:** Eliminating sub-$1000 markets removes the worst-slippage trades.
Even with a theoretically correct signal, buying at 0.58 when fair value is 0.50 (spread
captures all the edge) produces losses. This is loss-prevention rather than win-rate
improvement — but it increases edge per executed trade.

---

## Phase 2 — Medium Impact, Some Risk (Weighting and Range Reform)

**Goal:** Fix the structural ceiling on model edge, enable dynamic per-indicator weighting,
and add inter-timeframe confirmation for weather signals.
**Mechanism:** These changes alter how the existing composite is computed; they require
calibration validation before going live. Target: +2–3% additional win rate.

---

### Step 2.1 — Widen Composite Probability Range

**Files:** `backend/core/signals.py`

**Problem:**
`model_up_prob = 0.50 + composite * 0.15` (signals.py:208) hard-clamps the model output to
`[0.35, 0.65]`. When composite = +1.0 (all indicators agree strongly), model prob is 65%.
If market is at 50%, edge = 15%. Kelly on a 65% vs 50% event at $10,000 bankroll:
`f = (0.65 * 1 - 0.35) / 1 = 0.30`. With `KELLY_FRACTION = 0.15`: f* = 4.5%, size = $450.
But `MAX_TRADE_SIZE = $75` caps it. So Kelly never governs — the $75 cap always binds.
More critically, the 0.15 coefficient means that when several indicators weakly agree (composite
= +0.3), model prob = 53.5% — barely above 50%, indistinguishable from noise.

**What to build:**

Change signals.py:208–209:
```python
# Before
model_up_prob = 0.50 + composite * 0.15
model_up_prob = max(0.35, min(0.65, model_up_prob))

# After
model_up_prob = 0.50 + composite * 0.20
model_up_prob = max(0.30, min(0.70, model_up_prob))
```

This allows the model to express up to 20% edge when all indicators converge (composite ≈ ±1),
and the range becomes `[0.30, 0.70]`. Do NOT widen further without additional calibration data.

**Acceptance criterion:**
- When composite > 0.8 (strong agreement), model prob > 0.65 (was capped at 0.65 before).
- When composite ≈ 0 (no agreement), model prob stays near 0.50.
- After 30 paper trades: compare the distribution of `model_probability` in the Signal DB
  table. The new distribution should show wider spread; mean absolute deviation from 0.5
  should increase by ≥0.02.
- No regression: `passes_threshold` rate should not drop (wider range should produce more
  actionable signals, not fewer).

**Effort:** Small (two-line change, but requires monitoring for miscalibration)

**Expected mechanism:** A wider output range allows Kelly sizing to actually respond to
signal strength. When composite = +0.6 (moderate conviction), new model prob = 0.62 vs old
0.59 — the difference in suggested size with fractional Kelly is meaningful. It also makes
the edge signal more informative for position filtering.

---

### Step 2.2 — Dynamic Indicator Weighting Based on Recent Accuracy

**Files:** `backend/config.py`, `backend/core/signals.py`, `backend/models/database.py`

**Problem:**
Weights are static constants (config.py:62–67): RSI=0.20, Momentum=0.35, VWAP=0.20,
SMA=0.15, MarketSkew=0.10. These were set by intuition. In trending markets, Momentum is
highly predictive; in ranging markets, RSI and VWAP dominate. A fixed weighting scheme
averages across regime, diluting the best-performing indicator for current conditions.

**What to build:**

1. Add a `SignalComponent` table (or extend the existing `Signal` model) to store
   per-indicator votes and whether the overall signal was correct at settlement.
   Alternatively, since the `Signal` table already stores `reasoning` (which contains
   per-indicator values), parse those post-settlement to build accuracy stats.

2. Add `compute_dynamic_weights(window_n: int = 30) -> dict` function in signals.py:
   - Query last `window_n` settled signals from DB.
   - For each signal, parse the reasoning string to extract per-indicator signals
     (already logged as `RSI:XX Mom1m:XX VWAP:XX SMA:XX`).
   - Compare each indicator's sign to the actual outcome.
   - Compute per-indicator accuracy: `accuracy_i = correct_predictions_i / window_n`.
   - Normalize: `weight_i = accuracy_i / sum(accuracy_j for all j)`.
   - Apply floor of 0.05 per indicator to prevent full zeroing.
   - Cache result for 1 hour (re-compute every hour, not every trade).

3. In `generate_btc_signal()` (signals.py:196–204), replace the static `w = settings`
   composite with dynamic weights when `window_n` settled signals are available; fall back
   to static weights otherwise.

**Acceptance criterion:**
- After 30 settled paper trades, `compute_dynamic_weights()` returns weights that differ from
  config defaults by at least 0.05 on at least one indicator.
- Dynamic weights are logged on each scan: `"Using dynamic weights: RSI=0.XX Mom=0.XX..."`.
- If DB has fewer than 30 settled signals, static weights are used and logged accordingly.
- Unit test: provide mock settled signals where RSI is always correct and Momentum is always
  wrong; assert resulting weight for RSI > 0.30 and Momentum < 0.15.

**Effort:** Medium (requires DB query, reasoning string parsing, and weight normalization)

**Expected mechanism:** If Momentum is overfitted to recent trending conditions but the regime
shifts to ranging, continuing to weight it at 35% hurts more than a recalibrated 15–20%.
Dynamic weighting adapts within 30 trades (roughly 2–3 days at current scan cadence).

---

### Step 2.3 — NWS Observed Temperature as Weather Signal Correction

**Files:** `backend/core/weather_signals.py`, `backend/data/weather.py`

**Problem:**
`fetch_nws_observed_temperature()` is fully implemented at weather.py:199 with correct NWS
API calls, city station mappings (e.g., KLGA for NYC), and Celsius-to-Fahrenheit conversion.
It is never called anywhere. This is a free cross-check: if yesterday's observed temperature
at a station was 5°F above the ensemble forecast, that station likely has a systematic warm
bias — today's ensemble forecast should be adjusted upward before computing market edge.

**What to build:**

1. In `generate_weather_signal()` (weather_signals.py:52), after fetching the ensemble
   forecast (line 61), call `fetch_nws_observed_temperature(market.city_key, yesterday)`.
2. If observed data is available:
   - Compute `obs_bias = observed['high'] - forecast_yesterday_mean`.
     (Requires caching yesterday's ensemble mean — store in a module-level dict keyed by
     `(city_key, date)`, populated on each forecast fetch.)
   - Apply bias correction: `adjusted_mean = forecast.mean_high + obs_bias * 0.5`
     (half-weight: NWS station may itself have microclimate bias).
   - Recompute `model_yes_prob` using `adjusted_mean` in the Gaussian CDF path
     (weather_signals.py:86–89) instead of raw `forecast.mean_high`.
3. Log the bias correction in reasoning string.

**Acceptance criterion:**
- For any US city where NWS returns data, `reasoning` includes `"NWS bias: +X.XF"`.
- When NWS returns None (non-US cities, API outage), signal generation falls back cleanly
  to ensemble-only path — no exception, no changed behavior.
- After 10 settled weather trades: check if cities with NWS correction have higher accuracy
  than those without.

**Effort:** Medium (async call inside signal generation; need to cache yesterday's ensemble
mean to compute bias; non-trivial but isolated to weather_signals.py)

**Expected mechanism:** NWS cross-validation catches the most common failure mode in weather
trading: ensemble cold/warm bias at a specific station. If the ensemble consistently
underpredicts temperature at KLGA (LaGuardia), every signal for NYC markets will be
systematically wrong. The bias correction closes that gap before it costs money.

---

### Step 2.4 — Ensemble Bimodality / Uncertainty Filter for Weather

**Files:** `backend/data/weather.py`, `backend/core/weather_signals.py`

**Problem:**
`EnsembleForecast` already stores all `member_highs` (weather.py:47) and has
`ensemble_agreement` property (weather.py:88), but `generate_weather_signal()` does not
check for bimodal distributions. A bimodal ensemble (half members at 55°F, half at 70°F)
gives a 50% probability estimate, but that 50% is not the same as an uncertain market — it
means the atmosphere genuinely has two possible states. Trading into this is gambling.

**What to build:**

1. Add `is_bimodal(threshold: float = 0.35) -> bool` method to `EnsembleForecast`
   (weather.py, after `ensemble_agreement` property at line 88):
   ```python
   def is_bimodal(self, gap_threshold_f: float = 8.0) -> bool:
       """True if member distribution has a gap > gap_threshold_f in the middle."""
       if len(self.member_highs) < 10:
           return False
       sorted_highs = sorted(self.member_highs)
       max_gap = max(sorted_highs[i+1] - sorted_highs[i]
                     for i in range(len(sorted_highs)-1))
       return max_gap > gap_threshold_f
   ```

2. In `generate_weather_signal()` (weather_signals.py:52), after computing
   `model_yes_prob` (line 78):
   ```python
   if forecast.is_bimodal():
       edge = 0.0  # Zero out — ensemble is genuinely uncertain
       logger.info(f"Bimodal ensemble for {market.city_key} — skipping")
   ```

3. Add `ensemble_is_bimodal` flag to `WeatherTradingSignal` for UI visibility.

**Acceptance criterion:**
- When ensemble has a large internal gap (e.g., half members below 60°F, half above 70°F),
  signal edge is zeroed and market is logged as `"bimodal ensemble"`.
- For unimodal ensembles, behavior is identical to before.
- Unit test: construct an `EnsembleForecast` with `member_highs = [55]*16 + [72]*15`
  (gap of 17°F); assert `is_bimodal()` returns True and signal edge == 0.

**Effort:** Small (pure computation, isolated to weather.py + one guard in weather_signals.py)

**Expected mechanism:** Bimodal ensembles produce a 50% model probability that looks like a
pass but has zero predictive power. Filtering them out reduces false-positive actionable
signals in weather markets, where each trade has higher stakes ($100 max vs $75 BTC).

---

## Phase 3 — Structural Improvements (Risk-Adjusted Returns)

**Goal:** Dynamic Kelly, calibration threshold reduction, and copy trader quality improvements.
These do not directly raise win rate but significantly improve EV and reduce drawdown.

---

### Step 3.1 — Dynamic Kelly Based on Edge Strength and Volatility Regime

**Files:** `backend/core/signals.py`, `backend/config.py`

**Problem:**
`KELLY_FRACTION: float = 0.15` (config.py:45) is constant. It does not respond to:
- Strong-edge signals (composite > 0.8 deserves larger fraction than composite = 0.3)
- High-volatility regimes (micro.volatility > 0.1% per minute = dangerous for 5-min windows)
- Win streak / drawdown (a 5-trade losing streak should reduce exposure)

`calculate_kelly_size()` (signals.py:74) already takes `edge` and `probability` as inputs
but ignores volatility and recent performance.

**What to build:**

1. Add `compute_adaptive_kelly_fraction(edge: float, volatility: float, recent_win_rate: float) -> float`
   function in signals.py (after `calculate_kelly_size` at line 120):
   ```python
   def compute_adaptive_kelly_fraction(
       edge: float,
       volatility: float,
       recent_win_rate: float,
   ) -> float:
       base = settings.KELLY_FRACTION  # 0.15
       # Scale up for high edge (cap at 2× base)
       edge_factor = min(2.0, 1.0 + edge / 0.10)  # edge=10% -> 2x, edge=5% -> 1.5x
       # Scale down for high volatility
       vol_factor = max(0.5, 1.0 - max(0.0, volatility - 0.05) * 5)  # vol>5% per min -> halve
       # Scale down after losing streaks
       streak_factor = max(0.5, min(1.2, recent_win_rate / 0.55))
       return base * edge_factor * vol_factor * streak_factor
   ```

2. Add `get_recent_win_rate(window: int = 20) -> float` helper that queries the Signal DB
   (settled trades only) for the last `window` executed trades.

3. In `generate_btc_signal()` (signals.py:241–248), replace:
   ```python
   suggested_size = calculate_kelly_size(
       edge=abs(edge),
       probability=model_up_prob,
       market_price=market_up_prob,
       direction=direction,
       bankroll=bankroll,
   )
   ```
   with:
   ```python
   adaptive_kf = compute_adaptive_kelly_fraction(
       edge=abs(edge),
       volatility=micro.volatility,
       recent_win_rate=get_recent_win_rate(20),
   )
   suggested_size = calculate_kelly_size(
       edge=abs(edge),
       probability=model_up_prob,
       market_price=market_up_prob,
       direction=direction,
       bankroll=bankroll,
       kelly_fraction_override=adaptive_kf,
   )
   ```
   Add `kelly_fraction_override: Optional[float] = None` parameter to
   `calculate_kelly_size()` and use it when provided.

**Acceptance criterion:**
- On a high-edge signal (edge > 8%), suggested_size > $37.50 (> 0.5× base Kelly at $10k).
- On a high-volatility scan (micro.volatility > 0.08%), suggested_size < $37.50.
- After a 5-trade losing streak (recent_win_rate < 0.40), `adaptive_kf < 0.10`.
- Log line: `"Kelly fraction: adaptive=0.XX (edge_factor=X.X, vol_factor=X.X, streak_factor=X.X)"`.

**Effort:** Medium (new helper functions, one DB query per signal, parameter threading)

**Expected mechanism:** At current $75 hard cap, Kelly never governs even at maximum model
probability — the cap is always binding at $10k bankroll. Adaptive Kelly produces meaningful
bet-sizing variation that tracks edge quality; the $75 cap becomes a true safety net rather
than the default constraint. After a losing streak, it also prevents the ruin spiral of
continuing to size normally while below baseline.

---

### Step 3.2 — Lower Calibration Threshold

**Files:** `backend/core/calibration.py`

**Problem:**
`MIN_CALIBRATION_SAMPLES = 20` (calibration.py:21). With 11 cities in `WEATHER_CITIES`
(config.py:79) and limited trade frequency, most cities will have fewer than 20 settled
markets. The calibration file at `data/calibration.json` is almost certainly empty or
near-empty. Until threshold is crossed, the system uses `DEFAULT_SIGMA_F = 2.5`
(calibration.py:17) for all US cities regardless of actual forecast error. If the true
sigma for a city is 4.5°F (as it often is in spring), the model is systematically
overconfident, generating false edges.

**What to build:**

1. Change `MIN_CALIBRATION_SAMPLES = 20` → `MIN_CALIBRATION_SAMPLES = 5` (calibration.py:21).
   Five resolved markets is enough for a rough sigma estimate via Welford (already implemented
   in `update_calibration()` at line 53).

2. Add a `FALLBACK_SIGMA_SCALE: float = 1.3` multiplier: when `n < MIN_CALIBRATION_SAMPLES`,
   return `DEFAULT_SIGMA_F * 1.3` (3.25°F) instead of raw 2.5°F. This acknowledges that
   calibration-free estimates tend to be overconfident.
   Change `get_sigma()` (calibration.py:37):
   ```python
   if entry and entry.get("n", 0) >= MIN_CALIBRATION_SAMPLES:
       return float(entry["sigma"])
   # Pre-calibration: use inflated default
   return (DEFAULT_SIGMA_F if unit == "F" else DEFAULT_SIGMA_C * 1.8) * 1.3
   ```

3. Log calibration status per city on each weather scan: `"NYC sigma=3.25F (pre-cal, n=3/5)"`.

**Acceptance criterion:**
- After 5 settled NYC markets, `get_sigma("nyc")` returns the Welford-computed sigma
  rather than the default.
- Pre-calibration probability estimates are wider (sigma 3.25F vs 2.5F → fewer false-edge
  signals near the threshold temperature).
- `get_calibration_report()` shows per-city `n` values and whether they are active.

**Effort:** Small (two-line change to threshold + multiplier; logging addition)

**Expected mechanism:** Inflating sigma pre-calibration makes the Gaussian CDF component
(weather_signals.py:86–89) express less certainty near the threshold. The 70/30 blend
(ensemble count vs Gaussian) shifts toward ensemble counting, which is already the better
source for thin-calibration cities. Once calibration kicks in at n=5, the real sigma takes
over and probabilities become sharper.

---

### Step 3.3 — Forecast Stability Check for Weather

**Files:** `backend/core/weather_signals.py`, `backend/data/weather.py`

**Problem:**
There is no check for forecast drift between yesterday's ensemble and today's. A city where
the forecast changes >5°F between the 6am and noon runs is in an unstable atmospheric state
— ensemble spread increases, model accuracy drops, but the signal might still show a
confident probability. Trading an unstable forecast is analogous to trading BTC during a
flash crash: the signal is technically valid but the variance has spiked.

**What to build:**

1. Add a module-level `_forecast_history: Dict[str, EnsembleForecast]` in weather.py to
   cache the previous fetch for a given `(city_key, date)`. On each `fetch_ensemble_forecast()`
   call, before returning, compare to the previous cached value:
   ```python
   stability_delta = abs(new_forecast.mean_high - previous_forecast.mean_high)
   new_forecast.stability_delta = stability_delta  # add field to EnsembleForecast
   ```

2. Add `stability_delta: float = 0.0` and `FORECAST_UNSTABLE_THRESHOLD_F: float = 5.0` to
   `EnsembleForecast` (weather.py).

3. In `generate_weather_signal()` (weather_signals.py:52), add guard:
   ```python
   if forecast.stability_delta > 5.0:
       edge = 0.0
       logger.info(f"Unstable forecast for {market.city_key}: delta={forecast.stability_delta:.1f}F — skipping")
   ```

**Acceptance criterion:**
- On first fetch of a city (no history), `stability_delta = 0.0` and signal is unaffected.
- When consecutive fetches differ by >5°F (mock test), edge is zeroed and log shows delta.
- No regression for stable forecasts (delta < 5°F).

**Effort:** Small (in-memory state in weather.py + one guard in weather_signals.py)

**Expected mechanism:** Forecast instability is a known predictor of ensemble inaccuracy.
Skipping trades on volatile forecast days eliminates a class of losses where the ensemble
confidence looks high but the atmosphere has not yet settled into a regime.

---

### Step 3.4 — Copy Trader: Position Correlation Check

**Files:** `backend/strategies/copy_trader.py`

**Problem:**
`_mirror_buy()` (copy_trader.py:355) applies a 5% bankroll cap per trade but has no check
for position correlation. If 3 of the 10 tracked wallets simultaneously buy YES on the same
weather market, the system mirrors all three — resulting in 3× the intended exposure to one
market. This is concentrated risk masked as diversification.

**What to build:**

1. Add `_open_positions: dict[str, float]` to `CopyTrader.__init__()` (copy_trader.py:292)
   to track `{condition_id: total_usdc_allocated}`.

2. In `_mirror_buy()` (copy_trader.py:355), after computing `our_size`:
   ```python
   existing_exposure = self._open_positions.get(trade.condition_id, 0.0)
   max_per_market = 0.05 * self.bankroll  # 5% of bankroll max in any single market
   if existing_exposure >= max_per_market:
       logger.info(f"Skipping copy trade: {trade.condition_id[:16]} already at max exposure")
       return None
   our_size = min(our_size, max_per_market - existing_exposure)
   self._open_positions[trade.condition_id] = existing_exposure + our_size
   ```

3. In `_mirror_exit()` (copy_trader.py:389), clear the position:
   ```python
   self._open_positions.pop(trade.condition_id, None)
   ```

**Acceptance criterion:**
- If two wallets both buy the same condition_id, total allocated to that market is ≤ 5% of
  bankroll (not 10%).
- Third wallet attempting same condition_id returns None from `_mirror_buy()`.
- Log line shows `"existing_exposure=$XX.XX"` on each buy.
- Unit test: mock three traders all buying condition_id "ABC"; assert total allocation ≤ $500
  at $10k bankroll.

**Effort:** Small (in-memory dict, two guard statements, one pop on exit)

**Expected mechanism:** Prevents inadvertent position concentration from correlated wallets.
The leaderboard top 10 often trade the same markets (especially viral events), so this guard
is frequently triggered in practice.

---

### Step 3.5 — Copy Trader: Time-Decayed Leaderboard Scoring

**Files:** `backend/strategies/copy_trader.py`

**Problem:**
`LeaderboardScorer.fetch_and_score()` (copy_trader.py:88) fetches the 30-day leaderboard and
weights all profit equally. A trader who made $50k in week 1 but lost in weeks 2–4 scores
the same as one who made $12.5k consistently every week. The current score formula (lines
127–139) has no time dimension at all.

**What to build:**

1. After fetching leaderboard entries (copy_trader.py:91–98), also fetch 7-day leaderboard:
   ```python
   resp_7d = await self._http.get(f"{DATA_HOST}/leaderboard", params={"window": "7d"})
   entries_7d = {e.get("proxyWallet", ""): e for e in resp_7d.json()}
   ```

2. In the scoring loop (copy_trader.py:108–143), compute a blended profit score:
   ```python
   profit_7d = float(entries_7d.get(wallet, {}).get("profit", 0))
   blended_profit = 0.4 * profit_30d + 0.6 * profit_7d  # recent heavier
   profit_score = min(1.0, blended_profit / max_blended_profit) if max_blended_profit > 0 else 0.0
   ```

3. Compute `max_blended_profit` from all entries before the scoring loop.

**Acceptance criterion:**
- A trader with high 30d profit but negative 7d profit scores lower than before.
- Leaderboard refresh log shows `"7d leaderboard fetched: N entries"`.
- Unit test: construct two traders — one with profit_30d=10000, profit_7d=-2000 and one with
  profit_30d=4000, profit_7d=3000; assert the consistent trader scores higher with blending.

**Effort:** Small (one additional HTTP fetch + blending in scoring loop)

**Expected mechanism:** Recent performance is more predictive of near-term alpha than
30-day aggregate. Stale winners who have mean-reverted will be deprioritized in favor of
traders with consistent recent edge — reducing the lag between leaderboard refresh cycles.

---

### Step 3.6 — Copy Trader: Bankroll Estimation via Open Positions

**Files:** `backend/strategies/copy_trader.py`

**Problem:**
`est_bankroll = max(abs(profit) * 5, 1000.0)` (copy_trader.py:114). This assumes profit is
20% of bankroll. A trader with $500 profit could have a $2,500 or $500,000 bankroll — the
estimate is off by up to 200×. If their true bankroll is $100,000 and we think it's $2,500,
our proportional sizing is 40× too large: `their_pct = 500/2500 = 20%` when it should be
`500/100000 = 0.5%`. Result: we allocate 5% of our bankroll (the hard cap) on a trade the
expert sized at 0.5%.

**What to build:**

1. After fetching `entries` from leaderboard (copy_trader.py:91–98), fetch open positions for
   the top 20 wallets using `PolymarketCLOB.get_trader_positions()` (already implemented at
   polymarket_clob.py:226):
   ```python
   position_values: dict[str, float] = {}
   for e in entries[:20]:
       wallet = e.get("proxyWallet", "")
       if wallet:
           try:
               positions = await self._http.get(
                   f"{DATA_HOST}/positions",
                   params={"user": wallet, "sizeThreshold": "1.0"},
               )
               total_value = sum(float(p.get("value", 0)) for p in positions.json())
               position_values[wallet] = total_value
           except Exception:
               pass
   ```

2. In the `ScoredTrader` constructor (copy_trader.py:116–124), replace the bankroll estimate:
   ```python
   open_pos_value = position_values.get(wallet, 0.0)
   if open_pos_value > 0:
       est_bankroll = open_pos_value / 0.20  # assume 20% deployed at any time
   else:
       est_bankroll = max(abs(profit) * 5, 1000.0)  # fallback
   ```

**Acceptance criterion:**
- For any top-20 wallet with open positions, `estimated_bankroll` reflects positions data.
- Leaderboard log shows `"bankroll est: $XX,XXX (positions)"` vs `"$XX,XXX (fallback)"`.
- Proportional sizing is ≤ 2× the expert's actual sizing (vs potentially 40× before).

**Effort:** Medium (20 additional HTTP calls during leaderboard refresh, runs every 6 hours —
acceptable latency; add timeout and graceful fallback)

**Expected mechanism:** Accurate bankroll estimation is the foundation of proportional
copy trading. Without it, position sizing is random relative to the expert. This change
makes the copy trader meaningfully proportional rather than notionally proportional.

---

## Implementation Order and Dependencies

```
Phase 1 (run in parallel, no inter-dependencies):
  1.1 Order Book Imbalance    — medium effort, highest signal value
  1.2 Bollinger Bands         — small effort, pure computation
  1.3 MACD                    — small effort, pure computation
  1.4 Volume Filter           — small effort, immediate loss prevention

Phase 2 (after Phase 1 is deployed and 20 trades observed):
  2.1 Widen Probability Range — small effort, depends on observing Phase 1 edge distribution
  2.2 Dynamic Weighting       — medium effort, depends on having 30 settled signals in DB
  2.3 NWS Bias Correction     — medium effort, independent of BTC changes
  2.4 Bimodality Filter       — small effort, pure computation

Phase 3 (after Phase 2, requires more settled trade data):
  3.1 Adaptive Kelly          — medium effort, depends on DB having recent win rate data
  3.2 Lower Cal Threshold     — small effort, deploy alongside 2.3
  3.3 Forecast Stability      — small effort, independent
  3.4 Copy Trader Correlation — small effort, independent
  3.5 Time-Decayed Scoring    — small effort, independent
  3.6 Bankroll via Positions  — medium effort, highest copy trader impact
```

---

## Success Criteria

| Metric | Baseline | Phase 1 Target | Phase 2 Target | Phase 3 Target |
|--------|----------|----------------|----------------|----------------|
| BTC win rate | 54.8% | 57–58% | 59–61% | Maintain ≥59% |
| Mean abs edge on actionable signals | ~3–4% | ≥4.5% | ≥5.5% | ≥5.5% |
| Trades filtered by volume < $1k | unknown | 0 | 0 | 0 |
| Copy trader correlation events | unknown | — | — | ≤1 per day |
| Weather signal bimodal-filtered | unknown | — | ≥1 per week | ≥1 per week |
| Calibration cities at n≥5 | 0 | — | — | ≥4 cities |

**Measurement method:** Query `Signal` table in `tradingbot.db` where `executed=True` and
`platform='polymarket'`. Win rate = count of resolved `yes` outcomes matching `direction`
divided by total settled executed trades.

---

## Guardrails

**Must Have:**
- All Phase 1 changes are additive (no weight changes, no threshold changes).
- Every new indicator logs its value in the signal reasoning string.
- Fallback paths are present for all new API calls (NWS, order book, positions).
- `MAX_TRADE_SIZE = $75` cap remains throughout Phases 1 and 2.

**Must NOT Have:**
- No new external API dependencies that require paid keys.
- No changes to `calculate_edge()` (signals.py:48) — it is correct as-is.
- No changes to settlement logic in `backend/core/settlement.py`.
- Phase 2 dynamic weighting must never assign < 5% weight to any indicator (floor enforced).
- Do not raise `MAX_TRADE_SIZE` until Phase 3 adaptive Kelly is validated over ≥50 trades.
