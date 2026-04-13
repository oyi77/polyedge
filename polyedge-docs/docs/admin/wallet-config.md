---
sidebar_position: 9
---

# Wallet Configuration

The Wallet Config tab is the primary interface for managing trading wallets, tracking balances, and configuring the PolyEdge bot's wallet integrations.

## Access
Access to the Wallet Config tab requires admin login. Wallets and their configurations are stored in the system's `WALLETS` database table and are synchronized with the strategy engine.

## Wallet Table
A real-time table lists all wallets currently configured in the system:

| Column | Description |
|--------|-------------|
| **Address** | The 0x hex address of the wallet. |
| **Pseudonym** | A user-friendly name for the wallet (if configured). |
| **Source** | The wallet provider or source (e.g., `Polymarket`, `Kalshi`). |
| **Enabled** | Visual indicator showing if the wallet is **Enabled** (Green) or **Disabled** (Gray). |
| **Action** | The **Delete** button (×) to remove the wallet from the configuration. |

:::tip
Enabled wallets are active and used for trade execution and monitoring.
:::

## Wallet Controls

### Track Existing Wallet
The **Track Existing Wallet** form allows you to manually add an existing 0x address to the system's wallet configuration:
- **Address**: The 0x hex address of the wallet you want to track.
- **Pseudonym (Optional)**: A user-defined name for the wallet to help identify it.
- **Track**: Commits the new wallet to the database and refreshes the wallet configuration.

### Active Trading Wallet
The **Active Trading Wallet** section allows you to select a specific wallet to use for all automated trading activity:
- **Select**: A dropdown menu to choose from the list of configured wallets.
- **Clear Active**: Removes the selected wallet from the active trading role.

### Wallet Balance
The **Active Wallet Balance** section displays real-time balance information for the selected active wallet:
- **USDC Balance**: The current USDC balance in the wallet (color-coded for visibility).
- **Source**: Indicates if the balance is from the local cache (`cache`) or live from the API (`polymarket`).
- **Last Updated**: The timestamp of the last balance refresh.

:::warning
The active wallet balance is automatically refreshed every 30 seconds. Click the **↻** button to force a live refresh.
:::

### Create Fresh Wallet
The **Create Fresh Wallet** section allows you to generate a new 0x wallet address and private key for use with the PolyEdge bot:
- **Generate New Wallet**: Triggers the generation of a new wallet.
- **Address**: The 0x hex address of the newly created wallet.
- **Private Key**: The sensitive private key for the new wallet (highlighted in **Amber**).

:::warning
Save the newly created **Private Key** securely. It will not be shown again and is required for the bot to interact with the wallet for live trading.
:::

## How It Works
The Wallet Config tab interacts with the `/api/admin/wallets` and `/api/wallets` endpoints for all operations.
- **Active Role**: Only one wallet can be active for trading at any given time.
- **Balance Monitoring**: The bot uses the active wallet's balance to calculate trade sizes based on the Kelly Criterion.
- **Private Key**: When a new wallet is generated, the private key is displayed once in the UI and must be manually added to the `.env` file as `POLYMARKET_PRIVATE_KEY`.

:::tip
Use the **Wallet Config** tab to manage multiple wallets and switch between them for different trading strategies or risk levels.
:::
