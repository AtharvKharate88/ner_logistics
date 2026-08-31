from __future__ import annotations

from datetime import date, datetime
from typing import Any

import pandas as pd

from risk.config import RouteRiskConfig


class RiskServiceError(ValueError):
    pass


class RiskService:
    def __init__(self, config: RouteRiskConfig | None = None) -> None:
        self.config = config or RouteRiskConfig.from_env()
        self._predictions: pd.DataFrame | None = None
        self._available_dates: set[date] | None = None

    def load(self) -> None:
        if self._predictions is not None:
            return

        path = self.config.predictions_path
        if not path.exists():
            raise RiskServiceError(f"Risk predictions file not found: {path}")

        df = pd.read_parquet(path)
        required_columns = {"road_segment_id", "date", "anomaly_score", "risk_score", "risk_level"}
        missing = required_columns - set(df.columns)
        if missing:
            raise RiskServiceError(f"Risk predictions missing columns: {sorted(missing)}")

        df["date"] = pd.to_datetime(df["date"]).dt.date
        self._predictions = df
        self._available_dates = set(df["date"].unique())

    @property
    def available_date_range(self) -> tuple[date, date]:
        self.load()
        assert self._available_dates is not None
        return min(self._available_dates), max(self._available_dates)

    def parse_departure_date(self, departure_date: str) -> date:
        if not departure_date or not isinstance(departure_date, str):
            raise RiskServiceError("departureDate is required and must be a string in YYYY-MM-DD format.")

        try:
            parsed = datetime.strptime(departure_date.strip(), "%Y-%m-%d").date()
        except ValueError as exc:
            raise RiskServiceError(
                f"Invalid departureDate format: expected YYYY-MM-DD, got '{departure_date}'."
            ) from exc

        self.load()
        assert self._available_dates is not None
        if parsed not in self._available_dates:
            min_date, max_date = self.available_date_range
            raise RiskServiceError(
                f"departureDate '{departure_date}' is not available in risk predictions. "
                f"Available range: {min_date.isoformat()} to {max_date.isoformat()}."
            )
        return parsed

    def lookup_segments(self, segment_ids: list[str], departure_date: date) -> dict[str, dict[str, Any] | None]:
        self.load()
        assert self._predictions is not None

        if not segment_ids:
            return {}

        day_predictions = self._predictions[self._predictions["date"] == departure_date]
        indexed = day_predictions.set_index("road_segment_id")

        results: dict[str, dict[str, Any] | None] = {}
        for segment_id in segment_ids:
            if segment_id not in indexed.index:
                results[segment_id] = None
                continue

            row = indexed.loc[segment_id]
            if isinstance(row, pd.DataFrame):
                row = row.iloc[0]

            results[segment_id] = {
                "anomalyScore": float(row["anomaly_score"]),
                "riskScore": float(row["risk_score"]),
                "riskLevel": str(row["risk_level"]),
            }
        return results


_SERVICE: RiskService | None = None


def get_risk_service() -> RiskService:
    global _SERVICE
    if _SERVICE is None:
        _SERVICE = RiskService()
        _SERVICE.load()
    return _SERVICE
