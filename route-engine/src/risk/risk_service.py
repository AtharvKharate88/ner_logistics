from __future__ import annotations

from datetime import date, datetime
from typing import Any

import pandas as pd

from src.risk.config import RouteRiskConfig


class RiskServiceError(ValueError):
    pass


class RiskService:
    def __init__(self, config: RouteRiskConfig | None = None) -> None:
        self.config = config or RouteRiskConfig.from_env()

        # Risk predictions
        self._predictions: pd.DataFrame | None = None

        # Environmental/model features
        self._features: pd.DataFrame | None = None

        self._available_dates: set[date] | None = None

    def load(self) -> None:
        """
        Load both risk predictions and environmental features.
        Data is loaded only once and then kept in memory.
        """

        if self._predictions is not None and self._features is not None:
            return

        # ---------------------------------------------------------
        # Load risk predictions
        # ---------------------------------------------------------

        predictions_path = self.config.predictions_path

        if not predictions_path.exists():
            raise RiskServiceError(
                f"Risk predictions file not found: {predictions_path}"
            )

        predictions = pd.read_parquet(predictions_path)

        required_prediction_columns = {
            "road_segment_id",
            "date",
            "anomaly_score",
            "risk_score",
            "risk_level",
        }

        missing = required_prediction_columns - set(predictions.columns)

        if missing:
            raise RiskServiceError(
                f"Risk predictions missing columns: {sorted(missing)}"
            )

        predictions["date"] = pd.to_datetime(
            predictions["date"]
        ).dt.date

        # ---------------------------------------------------------
        # Load environmental/model features
        # ---------------------------------------------------------

        features_path = (
            predictions_path.parent / "risk_model_features.parquet"
        )

        if not features_path.exists():
            raise RiskServiceError(
                f"Risk model features file not found: {features_path}"
            )

        features = pd.read_parquet(features_path)

        required_feature_columns = {
            "road_segment_id",
            "date",
            "rainfall_1d",
            "rainfall_3d",
            "rainfall_7d",
            "slope",
            "landslides_5km",
        }

        missing = required_feature_columns - set(features.columns)

        if missing:
            raise RiskServiceError(
                f"Risk model features missing columns: {sorted(missing)}"
            )

        features["date"] = pd.to_datetime(
            features["date"]
        ).dt.date

        # ---------------------------------------------------------
        # Store in memory
        # ---------------------------------------------------------

        self._predictions = predictions
        self._features = features
        self._available_dates = set(predictions["date"].unique())

    @property
    def available_date_range(self) -> tuple[date, date]:
        self.load()

        assert self._available_dates is not None

        return min(self._available_dates), max(self._available_dates)

    def parse_departure_date(self, departure_date: str) -> date:
        if not departure_date or not isinstance(departure_date, str):
            raise RiskServiceError(
                "departureDate is required and must be a string in YYYY-MM-DD format."
            )

        try:
            parsed = datetime.strptime(
                departure_date.strip(),
                "%Y-%m-%d"
            ).date()

        except ValueError as exc:
            raise RiskServiceError(
                f"Invalid departureDate format: expected YYYY-MM-DD, got '{departure_date}'."
            ) from exc

        self.load()

        assert self._available_dates is not None

        if parsed in self._available_dates:
            return parsed

        min_date, max_date = self.available_date_range

        # Prototype predictions cover a climatology year
        # (currently 2025).
        # Future planning dates reuse the same month/day
        # from that year.
        if parsed > max_date:
            try:
                analog = parsed.replace(year=max_date.year)
            except ValueError:
                analog = date(max_date.year, 2, 28)

            if analog in self._available_dates:
                return analog

        raise RiskServiceError(
            f"departureDate '{departure_date}' is not available in risk predictions. "
            f"Available range: {min_date.isoformat()} to {max_date.isoformat()}."
        )

    def lookup_segments(
        self,
        segment_ids: list[str],
        departure_date: date,
    ) -> dict[str, dict[str, Any] | None]:

        self.load()

        assert self._predictions is not None
        assert self._features is not None

        if not segment_ids:
            return {}

        # ---------------------------------------------------------
        # Get risk predictions for requested date
        # ---------------------------------------------------------

        day_predictions = self._predictions[
            self._predictions["date"] == departure_date
        ]

        prediction_indexed = day_predictions.set_index(
            "road_segment_id"
        )

        # ---------------------------------------------------------
        # Get environmental features for requested date
        # ---------------------------------------------------------

        day_features = self._features[
            self._features["date"] == departure_date
        ]

        feature_indexed = day_features.set_index(
            "road_segment_id"
        )

        # ---------------------------------------------------------
        # Build response
        # ---------------------------------------------------------

        results: dict[str, dict[str, Any] | None] = {}

        for segment_id in segment_ids:

            # No risk prediction for this segment
            if segment_id not in prediction_indexed.index:
                results[segment_id] = None
                continue

            prediction_row = prediction_indexed.loc[segment_id]

            # Protect against duplicate segment IDs
            if isinstance(prediction_row, pd.DataFrame):
                prediction_row = prediction_row.iloc[0]

            result: dict[str, Any] = {
                # Existing risk information
                "anomalyScore": float(
                    prediction_row["anomaly_score"]
                ),
                "riskScore": float(
                    prediction_row["risk_score"]
                ),
                "riskLevel": str(
                    prediction_row["risk_level"]
                ),
            }

            # -----------------------------------------------------
            # Add environmental features
            # -----------------------------------------------------

            if segment_id in feature_indexed.index:

                feature_row = feature_indexed.loc[segment_id]

                # Protect against duplicate segment IDs
                if isinstance(feature_row, pd.DataFrame):
                    feature_row = feature_row.iloc[0]

                result.update({
                    "rainfall_1d": (
                        float(feature_row["rainfall_1d"])
                        if pd.notna(feature_row["rainfall_1d"])
                        else None
                    ),

                    "rainfall_3d": (
                        float(feature_row["rainfall_3d"])
                        if pd.notna(feature_row["rainfall_3d"])
                        else None
                    ),

                    "rainfall_7d": (
                        float(feature_row["rainfall_7d"])
                        if pd.notna(feature_row["rainfall_7d"])
                        else None
                    ),

                    "slope": (
                        float(feature_row["slope"])
                        if pd.notna(feature_row["slope"])
                        else None
                    ),

                    "landslides_5km": (
                        float(feature_row["landslides_5km"])
                        if pd.notna(feature_row["landslides_5km"])
                        else None
                    ),
                })

            else:
                # Features unavailable for this segment
                result.update({
                    "rainfall_1d": None,
                    "rainfall_3d": None,
                    "rainfall_7d": None,
                    "slope": None,
                    "landslides_5km": None,
                })

            results[segment_id] = result

        return results


_SERVICE: RiskService | None = None


def get_risk_service() -> RiskService:
    global _SERVICE

    if _SERVICE is None:
        _SERVICE = RiskService()
        _SERVICE.load()

    return _SERVICE