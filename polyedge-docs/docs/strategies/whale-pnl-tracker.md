---
sidebar_position: 8
---

# Whale PNL Tracker

The Whale PNL Tracker strategy identifies and follows top-performing "whale" traders based on their realized profit and loss (PNL).

:::info
This strategy works on the premise that whales with high realized PNL have sustainable alpha that persists, rather than just large bankrolls.
:::

## How It Works

The strategy monitors the positions of top-performing wallets ranked by their actual realized PNL (from the Polymarket Data API), not just their leaderboard ranking. It identifies new/unseen positions and mirrors them proportionally to the bot's bankroll.

The technical mechanism includes:
- **Whale Scoring**: Calculates a score (0-1 scale) for each discovered whale based on realized PNL, win rate, and consistency over a recency window.
- **PNL Ranking**: Ranks wallets by their scores and selects the top N whales (up to 5 by default).
- **Position Monitoring**: Fetches the current positions for each tracked whale via the Polymarket Data API.
- **Direction Inference**: Automatically maps the whale's side (YES/NO) to a corresponding "UP" or "DOWN" signal.
- **Proportional Mirroring**: Calculates the appropriate trade size (typically 10% of the bankroll) based on the detected whale's activity.

## Configuration

Relevant environment variables and settings for the Whale PNL Tracker strategy:

| Variable | Description | Default |
|----------|-------------|---------|
| `max_whales` | The maximum number of top-performing whales to follow. | 5 |
| `min_whale_score` | The minimum required whale score (0-1 scale) to track. | 0.3 |
| `min_trades` | The minimum number of trades for a whale to be ranked. | 20 |
| `recency_days` | The number of days of history to consider for whale ranking. | 30 |
| `copy_fraction` | The fraction of the bankroll to risk per whale signal. | 0.10 |
| `min_position_size` | The minimum dollar amount of a whale's position to consider. | 100.0 |
| `signal_cooldown_minutes` | The minimum amount of time between signals for the same market. | 5 |

## Signal Generation

Signals are produced when:
1. Top-performing whales are successfully discovered and ranked.
2. New/unseen positions are detected for those whales.
3. The detected position is a "BUY" (for an entry) or a significant "SELL" (for an exit).
4. The whale's current score meets the `min_whale_score` threshold.
5. The detected position size is at least $100.

The strategy computes a "BUY YES" or "BUY NO" direction to match the whale's activity.

## Risk Controls

- **Score Threshold**: Only follow whales with a proven track record (score > 0.3).
- **Position Size Filter**: Excludes small/insignificant positions that whales might be using for hedging.
- **Signal Cooldown**: Prevents overtrading on the same market by enforcing a 5-minute gap between signals.
- **Execution Mode**: Operates in "paper" mode by default to validate the whale's alpha before risking live capital.

## Example

1. **Analysis**: Whale Discovery identifies "Whale B" with a score of 0.85 based on their $500k realized PNL over the last 30 days.
2. **Monitoring**: The bot detects that "Whale B" just opened a new $50,000 "YES" position on "Will the 10-year Treasury yield be above 4.5%?".
3. **Sizing**: The bot calculates its own bankroll-proportional size (e.g., 10% of bankroll = $500).
4. **Execution**: The bot places a $500 "BUY YES" order on the same market.
5. **Result**: The whale's alpha is captured, and the bot profits from their successful prediction.
