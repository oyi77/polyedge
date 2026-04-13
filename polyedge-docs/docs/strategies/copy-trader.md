---
sidebar_position: 4
---

# Copy Trader

The Copy Trader strategy identifies and mirrors the positions of high-performing traders on prediction markets like Polymarket. By tracking the most successful accounts, it captures their expertise and proprietary analysis.

:::info
This strategy works on the premise that top traders on prediction market leaderboards possess repeatable alpha and sustainable edge.
:::

## How It Works

The strategy monitors the activities of top-performing wallets based on their realized profit and loss (PNL) and leaderboard rankings. It aims to mirror their trades proportionally to the bot's bankroll.

The technical mechanism includes:
- **Leaderboard Scoring**: Refreshes the top-50 leaderboard every 6 hours and calculates scores based on PNL, win rate, and consistency.
- **Wallet Tracking**: Tracks a configurable number of top wallets (up to 20 by default).
- **Trade Detection**: Polls the `/trades` endpoint for each tracked wallet every 60 seconds to detect new trade entries.
- **Proportional Mirroring**: Calculates the appropriate trade size based on the current bankroll and mirrors the detected trade.
- **Exit Tracking**: Monitors when the tracked wallet exits a position. If the cumulative SELL amount exceeds 50% of the original entry, the strategy triggers a mirror exit.

## Configuration

Relevant environment variables and settings for the Copy Trader strategy:

| Variable | Description | Default |
|----------|-------------|---------|
| `max_wallets` | The maximum number of top-performing wallets to follow. | 20 |
| `min_score` | The minimum required leaderboard score for a wallet to be tracked. | 60.0 |
| `poll_interval` | How often the bot polls for new trades from tracked wallets. | 60 |
| `interval_seconds` | Frequency of the strategy execution cycle. | 60 |

## Signal Generation

Signals are produced when:
1. A new trade is detected in one of the tracked wallets.
2. The detected trade is a "BUY" (for an entry) or a significant "SELL" (for an exit).
3. The wallet's current leaderboard score meets the `min_score` threshold.
4. The strategy successfully fetches the `clobTokenId` for the corresponding market condition.

The strategy computes a "BUY YES" or "BUY NO" direction to match the whale's activity.

## Risk Controls

- **Wallet Filtering**: Only follows wallets that meet specific scoring criteria.
- **Sizing Constraints**: Mirrors trades proportionally to the bot's bankroll, preventing overexposure to any single whale's position.
- **Auto-Approval**: Typically operates with auto-approval (within risk manager bounds) but sends post-execution alerts via Telegram.
- **Max Wallets Cap**: Limits the number of tracked wallets (capped at 40 total) to avoid runaway complexity.

## Example

1. **Analysis**: The leaderboard scores "Whale A" with 85/100 based on their recent win rate and realized PNL.
2. **Monitoring**: The bot detects that "Whale A" just spent $5,000 to buy YES shares on "Will the Fed cut rates in May?".
3. **Sizing**: The bot calculates its own bankroll-proportional size (e.g., 2% of bankroll = $100).
4. **Execution**: The bot places a $100 "BUY YES" order on the same market.
5. **Exit**: 3 days later, "Whale A" sells 70% of their position. The bot detects this and also exits its $100 position.
