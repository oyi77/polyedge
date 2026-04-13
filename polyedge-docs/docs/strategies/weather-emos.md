---
sidebar_position: 3
---

# Weather EMOS

The Weather EMOS strategy is a probabilistic temperature forecasting approach that leverages ensemble model output statistics (EMOS) for trading on weather-related prediction markets.

:::info
EMOS is a standard statistical method for calibrating ensemble forecasts to obtain reliable probability distributions for surface temperature and other weather variables.
:::

## How It Works

The strategy uses calibrated normal distributions to compute the probability of a temperature threshold being exceeded in major US cities. It specifically monitors weather markets for cities like New York, Chicago, Miami, Denver, Los Angeles, Dallas, Seattle, and Atlanta.

The technical mechanism includes:
- **Data Integration**:
  - **Open-Meteo API**: Fetches current and daily ensemble temperature forecasts (31 members).
  - **NOAA NBM**: Incorporates the National Blend of Models for probabilistic percentile forecasts.
  - **Polymarket Gamma API**: Scans for active weather market prices.
- **EMOS Calibration**:
  - Maintains a 30-40 day rolling window of forecast/observation triplets (ensemble mean, ensemble standard deviation, and verifying observation).
  - Fits a linear correction: `calibrated_mean = a + b * ensemble_mean`.
  - Computes the probability `Pr(T > threshold)` using the calibrated normal distribution.
- **Observation Threshold**: Requires a minimum of 10 observations (N >= 10) for a city before the calibration is considered reliable enough to trade.

## Configuration

Relevant environment variables and settings for the Weather EMOS strategy:

| Variable | Description | Default |
|----------|-------------|---------|
| `min_edge` | The minimum difference between the calibrated probability and the market price. | 0.05 (5%) |
| `calibration_window_days` | Number of days of historical data to use for EMOS calibration. | 40 |
| `min_calibration_observations` | Minimum number of observations required to activate trading for a city. | 10 |
| `max_position_usd` | The maximum dollar amount to allocate per position. | 100 |
| `interval_seconds` | Frequency of the strategy execution cycle. | 300 |

## Signal Generation

Signals are produced when:
1. The absolute difference between the calibrated model probability and the market's mid-price exceeds the `min_edge` threshold.
2. The city has at least 10 calibration observations.
3. The temperature threshold is successfully extracted from the market question.

The strategy computes the probability for "above" or "below" based on the market's specific threshold and compares it to the Polymarket YES price.

## Risk Controls

- **Edge Threshold**: Requires at least a 5% (8% in some implementations) absolute edge before firing.
- **Position Sizing**: Uses Fractional Kelly sizing (typically 0.15 multiplier) to determine the optimal bet size.
- **Trade Caps**: Individual trades are capped at $100 per position.
- **Calibration Check**: If the calibration data is insufficient, the strategy skips the market to avoid trading on uncalibrated raw forecasts.

## Example

1. **Market**: "Will New York City max temperature exceed 85°F on June 15?"
2. **Analysis**: The 31-member GFS ensemble mean for NYC is 82°F.
3. **Calibration**: After applying EMOS (based on the last 40 days of NYC forecasts vs actuals), the calibrated mean is adjusted to 84.5°F with a standard deviation of 1.5°F.
4. **Probability**: The model calculates a 37% probability that the temperature will exceed 85°F.
5. **Market Check**: Polymarket YES shares are trading at $0.25 (25% probability).
6. **Execution**: The 12% edge (37% - 25%) exceeds the 5% threshold. A "BUY YES" signal is generated.
