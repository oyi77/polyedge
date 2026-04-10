import time
import logging
from collections import defaultdict
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("trading_bot.ratelimit")

class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    In-process rate limiter using a sliding window per client IP.

    LIMITATION: State is stored in-process memory and resets on every restart.
    In multi-worker deployments (e.g. gunicorn with multiple workers), each worker
    maintains its own counter, so the effective limit is requests_per_minute * num_workers.
    For production multi-worker environments, replace with a shared backend such as
    Redis (e.g. slowapi with redis) to enforce limits across all processes.
    """

    def __init__(self, app, requests_per_minute: int = 100):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self._requests: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        window_start = now - 60

        # Clean old entries for this IP
        self._requests[client_ip] = [
            t for t in self._requests[client_ip] if t > window_start
        ]

        # Evict empty IP entries periodically to prevent memory leak
        if len(self._requests) > 10000:
            self._requests = defaultdict(list, {k: v for k, v in self._requests.items() if v})

        if len(self._requests[client_ip]) >= self.requests_per_minute:
            logger.warning("Rate limit exceeded for %s", client_ip)
            raise HTTPException(status_code=429, detail="Rate limit exceeded")

        self._requests[client_ip].append(now)
        return await call_next(request)
