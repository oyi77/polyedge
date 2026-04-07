"""Stub: collects historical market and trade data for model training.

Phase 4 of the polyedge plan will populate this with Polymarket Data API
crawlers, on-chain whale aggregations, and sentiment caches.
"""
from dataclasses import dataclass
from typing import List


@dataclass
class TrainingExample:
    features: dict
    label: float  # outcome: 1.0 if YES resolved, 0.0 otherwise


class DataCollector:
    def collect(self, lookback_days: int = 30) -> List[TrainingExample]:
        raise NotImplementedError("Phase 4: implement Polymarket Data API crawler")
