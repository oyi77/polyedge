---
sidebar_position: 5
title: Polymarket Setup
description: Guide to configuring Polymarket API and wallet credentials.
---

# Polymarket Setup

Polymarket is a decentralized prediction market running on the **Polygon (Layer 2)** network. To trade with real money, you'll need to configure your API credentials and a wallet.

## The One-Key Setup

The easiest way to start trading is to provide a single private key. PolyEdge uses the official Polymarket CLOB SDK, which can **automatically derive** your API credentials from your private key.

### Step 1: Get Your Private Key

1.  Open your Ethereum wallet (like MetaMask or Rabby).
2.  Switch to the **Polygon** network.
3.  Go to your account settings and find "Export Private Key."
4.  Copy the private key (it starts with `0x`).

### Step 2: Configure Environment Variables

Open your `.env` file and set the following variable:

```bash
# .env file
POLYMARKET_PRIVATE_KEY=0x1234567890abcdef...
```

:::info
This is the **only** credential required. PolyEdge will automatically sign a message to create your API keys on your behalf.
:::

## Optional: Manual Credentials

If you already have API keys from [polymarket.com/api-keys](https://polymarket.com/api-keys), you can provide them manually to skip the derivation step:

```bash
POLYMARKET_PRIVATE_KEY=0x1234567890abcdef...
POLYMARKET_API_KEY=your_api_key
POLYMARKET_API_SECRET=your_api_secret
POLYMARKET_API_PASSPHRASE=your_passphrase
```

## Trading Modes for Polymarket

PolyEdge supports different modes for interacting with the Polymarket platform:

| Mode | Description | Requirements |
|------|-------------|--------------|
| **Paper** | Simulation with fake money. No real transactions. | None |
| **Testnet** | Trading on Mumbai/Amoy testnets with fake USDC. | `POLYMARKET_PRIVATE_KEY` only |
| **Live** | Real trading on Polymarket Mainnet. | `POLYMARKET_PRIVATE_KEY` only (auto-derives) |

## Testing the Connection

Once you've configured your credentials, restart the bot and check the dashboard.

1.  **System Status**: Go to **Admin > System Status**.
2.  **Polymarket Status**: Look for the Polymarket integration indicator. It should show "Connected" or "Healthy."
3.  **Wallet Balance**: The dashboard should display your actual USDC balance on Polygon (if in `live` mode).

## Security Best Practices

*   **NEVER share your private key** with anyone.
*   **NEVER commit your `.env` file** to a public repository like GitHub.
*   The `POLYMARKET_PRIVATE_KEY` is used for signing only—it is never transmitted over the network.
*   Derived API credentials are stored only in the bot's memory and are not saved to the database.

## Troubleshooting

**"API key derivation failed"**
*   Ensure your private key is a valid 64-character hex string starting with `0x`.
*   Check that you have a small amount of MATIC (POL) in your wallet for account initialization.

**"Insufficient Balance"**
*   Polymarket trades are settled in **USDC.e** (bridged USDC) on Polygon. Ensure you have enough USDC in your wallet.
*   Verify you're on the correct network (Mainnet vs. Testnet).

:::tip
Visit the [Polymarket API Keys](https://polymarket.com/api-keys) page to manage your existing keys or revoke them if necessary.
:::
