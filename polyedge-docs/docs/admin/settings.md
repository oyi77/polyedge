---
sidebar_position: 5
---

# General Settings

The Settings tab provides a comprehensive interface for viewing and editing all bot-level configuration parameters. These settings are organized into logical sections for easy navigation and management.

## Access
Access to the Settings tab requires admin login. Settings are stored as a JSON object in the system database and hot-reloaded when saved.

## Configuration Sections
The settings are grouped into categories for efficiency. Each section can be collapsed or expanded to view its fields.

| Section | What It Controls |
|---------|------------------|
| **Trading** | High-level trading behavior and mode selection. |
| **Signal Approval** | Manual vs. automated signal processing. |
| **Weather** | Temperature forecast thresholds and GFS ensemble weights. |
| **Risk Management** | Capital allocation and drawdown safety limits. |
| **Signal Weights** | Relative importance of various technical indicators. |
| **AI / LLM** | AI provider selection, model names, and signal weights. |
| **API Keys** | External service keys (e.g., Groq, Claude, Tavily). |
| **Telegram** | Bot token and admin chat ID configuration. |
| **Web Search Settings** | Search depth and provider for real-time market research. |
| **Security** | Admin password and access control settings. |
| **System** | Process-level configurations and logging levels. |

## Field Editor
Each setting is presented as a field with its current value. Changes are tracked locally in the UI before being committed to the database.

| Field Type | How To Edit |
|------------|-------------|
| **Boolean** | Toggle switch (Green = Enabled, Gray = Disabled). |
| **Number** | Numeric input with support for decimal values (e.g., Kelly Fraction). |
| **Text** | String input for names, IDs, or descriptions. |
| **Select** | Dropdown menu for fixed options (e.g., Trading Mode). |
| **Secret** | Masked password input (e.g., API keys). Click **Update** to set a new value. |

:::warning
Secret fields (API keys, passwords) are masked for security. Once set, they cannot be retrieved via the UI. Use the **Update** button to overwrite an existing value.
:::

## How It Works
When you modify a field, the section is marked as **Modified**. Clicking **Save Section** sends a `PATCH` request to `/api/admin/settings` with the updated key-value pairs. 
- **Validation**: The backend validates numeric types and mandatory fields before committing.
- **Hot-Reload**: The trading engine automatically reloads the updated settings without a restart.
- **Toasts**: A success or error notification confirms the outcome of the save operation.

:::tip
Individual sections can be saved independently. This is useful for making incremental changes to risk or strategy parameters without affecting other parts of the system.
:::
