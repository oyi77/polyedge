"""Prediction engine — interface scaffold for the future ML model.

The current implementation is a deterministic logistic baseline so the
end-to-end pipeline (feature extraction → predict → consume) is callable
without a trained model. Phase 4 of the polyedge plan will swap this for
an ensemble (LSTM + XGBoost + Transformer) without changing the interface.
"""
import math
from dataclasses import dataclass
from typing import Any, Dict, Optional


@dataclass
class Prediction:
    probability_yes: float
    confidence: float
    model_version: str


# Default feature weights for the baseline scorer.
# Phase 4 trainers will replace these with learned coefficients.
DEFAULT_WEIGHTS: Dict[str, float] = {
    "edge": 1.5,
    "model_probability": 2.0,
    "market_probability": -2.0,
    "whale_pressure": 0.8,
    "sentiment": 0.6,
    "volume_log": 0.3,
}


def _sigmoid(x: float) -> float:
    if x >= 0:
        z = math.exp(-x)
        return 1.0 / (1.0 + z)
    z = math.exp(x)
    return z / (1.0 + z)


class PredictionEngine:
    MODEL_VERSION = "baseline-0.1"

    def __init__(self, weights: Optional[Dict[str, float]] = None):
        self.weights = weights or DEFAULT_WEIGHTS

    def extract_features(self, market: Dict[str, Any], signal_data: Optional[Dict[str, Any]] = None) -> Dict[str, float]:
        signal_data = signal_data or {}
        volume = float(market.get("volume", 0.0))
        # Cap volume to prevent extreme values from dominating the logistic sum.
        # Typical Polymarket market volumes are O(1k–100k); cap at 1000 keeps
        # the feature on the same scale as the other inputs.
        volume_capped = min(max(volume, 0.0), 1000.0)
        return {
            "edge": float(signal_data.get("edge", 0.0)),
            "model_probability": float(signal_data.get("model_probability", 0.5)),
            "market_probability": float(signal_data.get("market_probability", 0.5)),
            "whale_pressure": float(signal_data.get("whale_pressure", 0.0)),
            "sentiment": float(signal_data.get("sentiment", 0.0)),
            "volume_log": math.log1p(volume_capped),
        }

    def predict(self, features: Dict[str, float]) -> Prediction:
        z = sum(self.weights.get(k, 0.0) * v for k, v in features.items())
        prob = _sigmoid(z)
        # Confidence: distance from 0.5, scaled to [0, 1]
        confidence = min(1.0, abs(prob - 0.5) * 2.0)
        return Prediction(
            probability_yes=round(prob, 6),
            confidence=round(confidence, 6),
            model_version=self.MODEL_VERSION,
        )
