from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


DEFAULT_PREDICTIONS_PATH = (
    Path(__file__).resolve().parents[3] / "ml" / "data" / "processed" / "risk_predictions.parquet"
)


@dataclass(frozen=True)
class RouteRiskConfig:
    predictions_path: Path = DEFAULT_PREDICTIONS_PATH
    min_coverage_threshold: float = 0.80
    high_risk_threshold: float = 80.0
    medium_risk_threshold: float = 50.0
    distance_weight: float = 0.5
    risk_weight: float = 0.5

    @classmethod
    def from_env(cls) -> "RouteRiskConfig":
        return cls(
            predictions_path=Path(os.getenv("RISK_PREDICTIONS_PATH", str(DEFAULT_PREDICTIONS_PATH))),
            min_coverage_threshold=float(os.getenv("ROUTE_RISK_MIN_COVERAGE", "0.80")),
            high_risk_threshold=float(os.getenv("ROUTE_RISK_HIGH_THRESHOLD", "80")),
            medium_risk_threshold=float(os.getenv("ROUTE_RISK_MEDIUM_THRESHOLD", "50")),
            distance_weight=float(os.getenv("ROUTE_DISTANCE_WEIGHT", "0.5")),
            risk_weight=float(os.getenv("ROUTE_RISK_WEIGHT", "0.5")),
        )


def classify_risk_level(risk_score: float, config: RouteRiskConfig) -> str:
    if risk_score >= config.high_risk_threshold:
        return "HIGH"
    if risk_score >= config.medium_risk_threshold:
        return "MEDIUM"
    return "LOW"
