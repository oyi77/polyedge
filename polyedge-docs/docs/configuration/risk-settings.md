---
sidebar_position: 2
---

# Risk Management

PolyEdge includes a robust risk management system that operates at both the individual trade level and the portfolio level. These settings are primarily defined in `backend/config.py` and can be overridden via environment variables.

## Position Sizing

The bot uses the Kelly Criterion to determine optimal position sizing based on calculated edge and confidence.

### Kelly Fraction
- `KELLY_FRACTION` (Default: `0.05`): A multiplier applied to the standard Kelly sizing to reduce risk and volatility. A value of `0.05` represents a 1/20th Kelly strategy.

### Position Limits
- `MAX_TRADE_SIZE` (Default: `8.0`): The maximum USD amount allocated to a single trade, regardless of Kelly sizing results.
- `MAX_POSITION_FRACTION` (Default: `0.08`): The maximum percentage of total bankroll that can be allocated to a single position.

## Portfolio Guards

These settings protect your total capital from excessive exposure and correlation risk.

### Exposure Limits
- `MAX_TOTAL_EXPOSURE_FRACTION` (Default: `0.70`): The maximum portion of your bankroll that can be deployed across all open trades at once.
- `MAX_TOTAL_PENDING_TRADES` (Default: `12`): The total number of open/unsettled positions allowed before the bot stops placing new trades.

### Strategy Isolation
Each strategy has independent risk caps to prevent a single underperforming strategy from draining the entire bankroll:
- `WEATHER_MAX_TRADE_SIZE` (Default: `10.0`)
- `MAX_TRADE_SIZE` (BTC Default: `8.0`)

## Circuit Breakers

Circuit breakers provide an automated "kill switch" that pauses trading during periods of high losses or drawdown.

### Loss Limits
- `DAILY_LOSS_LIMIT` (Default: `5.0`): A fixed USD cap on realized daily losses. If reached, the bot pauses all automated trading for 24 hours.
- `DAILY_DRAWDOWN_LIMIT_PCT` (Default: `0.10`): Pauses trading if the 24-hour loss exceeds 10% of the total bankroll.
- `WEEKLY_DRAWDOWN_LIMIT_PCT` (Default: `0.20`): Pauses trading if the 7-day loss exceeds 20% of the total bankroll.

## Execution Risk

- `SLIPPAGE_TOLERANCE` (Default: `0.02`): The maximum allowed difference (2%) between the expected signal price and the actual execution price.
- `MIN_TIME_REMAINING` (Default: `60`): Prevents entry into markets that settle in less than 60 seconds, reducing the risk of being unable to exit or hedge.
- `MAX_TIME_REMAINING` (Default: `1800`): Limits entries to markets settling within the next 30 minutes for higher velocity trading.
