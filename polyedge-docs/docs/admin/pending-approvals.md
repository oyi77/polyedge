---
sidebar_position: 12
---

# Pending Trade Approvals

The Pending Approvals page provides a centralized interface for reviewing and approving or rejecting trading signals that have not met the automatic execution threshold. It allows you to batch-process signals for efficient trade execution.

## Access
Access to the Pending Approvals page requires admin login. Signals are added to the pending queue when their confidence level is below the auto-approve threshold (configured in Settings).

## Pending Approvals Table
A real-time table lists all signals currently in the pending queue:

| Column | Description |
|--------|-------------|
| **Market** | The ticker symbol or ID for the market (e.g., `BTC-100k-FRI`). |
| **Side** | The trade action: **BUY** (Green) or **SELL** (Red). |
| **Size** | The USDC size for the trade (e.g., `$10.00`). |
| **Confidence** | The bot's confidence level in the signal (0-100%). |
| **Created** | The timestamp of when the signal was generated. |
| **Action** | The **Approve** and **Reject** buttons for each signal. |

:::tip
Confidence levels are color-coded: **Green** for high (>70%), **Amber** for medium (>50%), and **Red** for low.
:::

## Batch Actions Bar
The top header provides controls for batch-processing multiple signals simultaneously:
- **Select All**: Selects or deselects all signals in the pending queue.
- **Approve Selected**: Approves all selected signals for execution.
- **Reject Selected**: Rejects all selected signals from the pending queue.
- **Clear All**: Rejects all signals in the pending queue.

:::warning
Batch-approving signals will immediately execute all selected trades on the active market provider.
:::

## How It Works
The Pending Approvals page interacts with the `/api/admin/pending-approvals` endpoint for all operations.
- **Manual Gate**: Signals that do not meet the auto-approve threshold are placed in the pending queue for review.
- **Trade Execution**: When a signal is approved, the bot immediately attempts to place the corresponding order on the active market (e.g., Polymarket).
- **Auto-Refresh**: The pending queue is automatically refreshed every 15 seconds.

:::tip
Use the **Pending Approvals** page to maintain manual control over high-value or high-risk trades.
:::

:::warning
Approving a signal will initiate a live trade with real financial risk. Review each signal's confidence and size carefully before proceeding.
:::
