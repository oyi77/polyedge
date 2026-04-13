---
sidebar_position: 1
---

# API Overview

The PolyEdge API provides a comprehensive interface for monitoring trading activity, managing bot state, and accessing real-time market data from Polymarket and Kalshi.

## Base URL

By default, the backend API runs on port 8000.

```bash
http://localhost:8000
```

## Authentication

Protected endpoints require authentication via a Bearer token. To obtain a token, authenticate using the admin login endpoint.

```bash
Authorization: Bearer <your_admin_token>
```

Admin endpoints require setting the `ADMIN_PASSWORD` in your `.env` file.

## Error Format

The API returns consistent error responses using the following structure:

```json
{
  "detail": "Error message description"
}
```

Common HTTP status codes:
- `200 OK`: Request succeeded
- `401 Unauthorized`: Authentication failed or token missing
- `403 Forbidden`: Insufficient permissions (admin required)
- `404 Not Found`: Resource does not exist
- `409 Conflict`: Resource already exists or bot state conflict
- `429 Too Many Requests`: Rate limit exceeded

## Rate Limits

The API implements a default rate limit of 100 requests per minute per client. Exceeding this limit results in a `429` response.

:::info
Rate limits are applied at the middleware level to ensure system stability during high-volatility market events.
:::
