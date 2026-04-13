---
sidebar_position: 4
---

# Credentials Management

The Credentials tab is the primary interface for managing sensitive API keys, secrets, and system-level authentication for the PolyEdge bot.

## Access
Access to this tab requires admin login. The credentials are encrypted at rest and masked in the UI to prevent accidental exposure.

## Trading Mode Credentials
PolyEdge requires different sets of credentials depending on the active trading mode. Each mode is visually color-coded for clarity:

| Mode | Label | Description |
|------|-------|-------------|
| **Paper** | Simulated | No credentials required. Uses real market data for simulation. |
| **Testnet** | Amoy | Requires `POLYMARKET_PRIVATE_KEY` for Polygon Amoy testnet. |
| **Live** | Mainnet | Requires `POLYMARKET_PRIVATE_KEY`, `POLYMARKET_API_KEY`, `POLYMARKET_API_SECRET`, and `POLYMARKET_API_PASSPHRASE` for Polygon mainnet. |

## Polymarket Credentials
Settings for the Polymarket CLOB (Central Limit Order Book) API:

| Field | Description | Requirement |
|-------|-------------|-------------|
| **Private Key** | Your 0x hex private key for the trading wallet. | Required for Testnet and Live modes. |
| **API Key** | Your CLOB API key provided by Polymarket. | Required for Live mode. |
| **API Secret** | Your CLOB API secret. | Required for Live mode. |
| **API Passphrase** | Your CLOB API passphrase. | Required for Live mode. |

:::warning
Never share your **Private Key** or CLOB credentials. The PolyEdge system persists these values to the local `.env` file. Do not commit your `.env` file to public version control.
:::

## Admin Password
The **Change Admin Password** section allows you to update the `ADMIN_API_KEY` used to access the dashboard.
- **New Password**: The new password for admin access.
- **Confirm Password**: Must match the new password.

:::tip
Changing the admin password will immediately log you out of the dashboard. You must log in with the new password to regain access.
:::

## How It Works
Credentials updated through this tab are written directly to the `.env` file and hot-reloaded into the running process. This ensures that updates take effect immediately without needing a full bot restart. The UI dynamically checks for missing credentials based on the selected **Trading Mode** and provides visual alerts if any required keys are not set.

:::warning
Switching to **Live** mode is only possible if all four Polymarket credentials have been successfully configured and validated by the backend.
:::
