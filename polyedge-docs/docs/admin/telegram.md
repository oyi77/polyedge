---
sidebar_position: 7
---

# Telegram Configuration

The Telegram tab provides a direct interface for managing and testing the bot's integration with the Telegram messaging platform.

## Access
Access to the Telegram configuration requires admin login. The Telegram bot token and admin chat IDs must be configured in the Settings tab under the **Telegram** section.

## Bot Integration
PolyEdge uses a Telegram bot to send real-time alerts and notifications for the following events:
- **Trade Signals**: Alerts for high-confidence trading opportunities.
- **Trade Execution**: Notifications for successfully placed buy or sell orders.
- **System Status**: Daily profit/loss summaries and system heartbeat alerts.
- **Admin Commands**: (Optional) Limited bot-level control via Telegram commands.

## Configuration Parameters
Telegram settings are managed in the **Settings** tab:

| Field | Description |
|-------|-------------|
| **TELEGRAM_BOT_TOKEN** | The API token provided by @BotFather. |
| **TELEGRAM_ADMIN_CHAT_IDS** | A comma-separated list of Telegram chat IDs (get these via @userinfobot). |

## System Controls

### Test Message
The **Send Test Message** button allows you to verify that the bot is correctly configured and can communicate with the specified admin chat IDs.
- **Sending**: The bot is currently attempting to send a test message to your configured Telegram account.
- **Success**: A confirmation message was successfully delivered to your Telegram app.
- **Error**: The message could not be delivered. Check your bot token and chat ID settings.

:::warning
The test message will fail if the `TELEGRAM_BOT_TOKEN` or `TELEGRAM_ADMIN_CHAT_IDS` are not correctly set in the Settings tab.
:::

## How It Works
When the **Send Test Message** button is clicked, the dashboard sends a `POST` request to `/api/admin/alerts/test`. The backend then attempts to initialize the Telegram bot and send a pre-formatted message to all chat IDs in the admin list.
- **Latency**: Notifications are typically delivered within 1-2 seconds of an event occurring.
- **Throttling**: The bot includes built-in rate-limiting to prevent Telegram API spam blocks.

:::tip
For the best experience, create a dedicated Telegram group for your PolyEdge bot and add all relevant chat IDs to the admin list.
:::
