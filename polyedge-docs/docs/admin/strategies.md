---
sidebar_position: 2
---

# Strategy Controls

The Strategies tab is the primary interface for managing individual trading methods within the PolyEdge orchestrator. It allows you to enable or disable specific strategies and trigger manual execution for testing or forced analysis.

## Access
Access to strategy controls is protected by admin login. Modifying strategy states requires a valid `ADMIN_API_KEY` stored in the system configuration.

## Strategy Cards
Each strategy is presented in a card format that summarizes its current state and configuration:

| Field | Description |
|-------|-------------|
| **Name** | The unique identifier for the strategy (e.g., `btc_oracle`, `weather_emos`) |
| **Category** | High-level classification (e.g., `AI`, `Weather`, `BTC`) |
| **Interval** | The frequency, in seconds, at which the strategy automatically scans for signals |
| **Status** | Visual indicator showing if the strategy is **Enabled** or **Disabled** |
| **Credentials** | List of required API keys or secrets for this specific strategy |

## Strategy Controls

### Enable/Disable
Toggling a strategy to **Enabled** adds it to the orchestrator's polling loop. The orchestrator will automatically run the strategy at its defined interval.
- **Enabled**: Strategy is active and generating signals.
- **Disabled**: Strategy is inactive. No new signals will be generated.

:::warning
Enabling a strategy that lacks required credentials will result in logged errors and failed signal generation. Check the **Credentials** section to ensure all necessary keys are configured.
:::

### Run Now
The **Run Now** button allows you to manually trigger a single execution cycle for the strategy, independent of its scheduled interval.
- **Running**: The strategy is currently fetching data and analyzing markets.
- **Done**: The execution cycle completed successfully.
- **Error**: The cycle failed. Hover over the error badge to see the specific error message (e.g., `Invalid API key`, `No markets found`).

## How It Works
When a strategy's state is toggled, the dashboard sends a `PATCH` request to `/api/admin/strategies/{name}`. The orchestrator hot-reloads the strategy list without requiring a full bot restart. Manual execution calls the `/api/admin/strategies/{name}/run` endpoint, which bypasses the scheduler for a single pass.

:::tip
For a list of all 9 available trading strategies and their underlying logic, refer to the **How It Works** section of the documentation.
:::
