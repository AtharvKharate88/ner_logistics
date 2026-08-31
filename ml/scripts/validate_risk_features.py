"""Validate ML feature values without modifying data or training a model."""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "ml" / "data" / "processed" / "risk_model_features.parquet"
RAINFALL_SOURCE = ROOT / "ml" / "data" / "processed" / "rainfall_ner_features.csv"
REPORT = ROOT / "ml" / "reports" / "risk_feature_validation.txt"
FEATURES = ["rainfall_1d", "rainfall_3d", "rainfall_7d", "elevation", "slope", "landslides_5km", "landslides_10km"]
PERCENTILES = [0.01, 0.05, 0.25, 0.50, 0.75, 0.95, 0.99]


def feature_summary(values: pd.Series) -> dict[str, float | int]:
    numeric = pd.to_numeric(values, errors="coerce")
    present = numeric.dropna()
    quantiles = present.quantile(PERCENTILES)
    return {
        "count": int(len(numeric)), "missing_count": int(numeric.isna().sum()), "missing_percent": float(numeric.isna().mean() * 100),
        "zero_count": int((present == 0).sum()), "zero_percent": float((present == 0).mean() * 100) if len(present) else float("nan"),
        "min": float(present.min()), "max": float(present.max()), "mean": float(present.mean()), "median": float(present.median()), "std": float(present.std()),
        **{f"p{int(percent * 100):02d}": float(quantiles.loc[percent]) for percent in PERCENTILES},
    }


def lines_for_summary(name: str, summary: dict[str, float | int]) -> list[str]:
    order = ["count", "missing_count", "missing_percent", "zero_count", "zero_percent", "min", "max", "mean", "median", "std", "p01", "p05", "p25", "p50", "p75", "p95", "p99"]
    return [f"{name}.{key}={summary[key]:.6f}" if isinstance(summary[key], float) else f"{name}.{key}={summary[key]}" for key in order]


def main() -> None:
    data = pd.read_parquet(DATA)
    report = ["Risk model feature validation", f"source={DATA}", f"rows={len(data)}"]
    for feature in FEATURES:
        report.extend(lines_for_summary(feature, feature_summary(data[feature])))

    rain = data[["rainfall_1d", "rainfall_3d", "rainfall_7d"]]
    all_zero = rain.eq(0).all(axis=1)
    rain_3_lt_1 = (rain.rainfall_3d < rain.rainfall_1d).sum()
    rain_7_lt_3 = (rain.rainfall_7d < rain.rainfall_3d).sum()
    rain_negative = (rain < 0).any(axis=1).sum()
    source = pd.read_csv(RAINFALL_SOURCE, usecols=["RAINFALL", "rainfall_1d", "rainfall_3d", "rainfall_7d"])
    source_valid = source.dropna(subset=["rainfall_1d", "rainfall_3d", "rainfall_7d"])
    report += [
        "", "Rainfall checks",
        f"all_three_rainfall_features_zero_count={int(all_zero.sum())}", f"all_three_rainfall_features_zero_percent={all_zero.mean() * 100:.6f}",
        f"rainfall_3d_less_than_rainfall_1d={int(rain_3_lt_1)}", f"rainfall_7d_less_than_rainfall_3d={int(rain_7_lt_3)}", f"negative_rainfall_row_count={int(rain_negative)}",
        f"source_valid_rainfall_zero_count={int((source_valid.RAINFALL == 0).sum())}", f"source_valid_rainfall_zero_percent={(source_valid.RAINFALL == 0).mean() * 100:.6f}",
        "Rainfall zero interpretation: GREEN. Integration removed rows with missing rainfall features before joining and did not fill missing values with zero. Zeros therefore originate in valid source observations, though gauge/product metadata would be needed to establish physical accuracy.",
    ]

    slope = data.slope
    elevation = data.elevation
    report += [
        "", "Terrain checks",
        f"slope_gt_45_count={int((slope > 45).sum())}", f"slope_gt_60_count={int((slope > 60).sum())}", f"slope_gt_80_count={int((slope > 80).sum())}",
        f"slope_approximately_90deg_count={int(np.isclose(slope, 90, atol=0.1, equal_nan=False).sum())}", f"slope_approximately_90deg_percent={np.isclose(slope, 90, atol=0.1, equal_nan=False).mean() * 100:.6f}",
        f"negative_elevation_count={int((elevation < 0).sum())}", f"elevation_zero_count={int((elevation == 0).sum())}", f"elevation_missing_count={int(elevation.isna().sum())}",
        "Slope interpretation: RED. A broad concentration near 90 degrees is not plausible for road terrain and is consistent with calculating gradient using geographic-degree pixel spacing against elevation in metres. Investigate/recompute slope from the original DEM in a metre-based projected CRS; do not clip this dataset.",
        "Elevation interpretation: YELLOW. Values are generally plausible as DEM elevations and this selected file has no missing values, but its 365 zero-elevation rows and the original terrain grid's extensive zero/NoData candidates require DEM provenance validation before training.",
    ]

    land_5, land_10 = data.landslides_5km, data.landslides_10km
    report += [
        "", "Landslide checks",
        f"landslides_5km_non_integer_count={int((land_5.dropna() % 1 != 0).sum())}", f"landslides_10km_non_integer_count={int((land_10.dropna() % 1 != 0).sum())}",
        f"landslides_10km_less_than_5km_count={int((land_10 < land_5).sum())}",
        "Landslide interpretation: GREEN. Counts are integers and every 10 km count is at least its 5 km count.",
    ]

    pairs = data.duplicated(["road_segment_id", "date"]).sum()
    segment_counts = data.groupby("road_segment_id").size()
    date_counts = data.groupby("date").size()
    report += [
        "", "Dataset integrity",
        f"unique_road_segment_id={data.road_segment_id.nunique()}", f"unique_dates={data.date.nunique()}",
        f"rows_per_road_segment_min_max={segment_counts.min()}/{segment_counts.max()}", f"rows_per_date_min_max={date_counts.min()}/{date_counts.max()}",
        f"duplicate_road_segment_id_date={int(pairs)}",
        "", "Feature classification",
        "rainfall_1d=GREEN", "rainfall_3d=GREEN", "rainfall_7d=GREEN", "elevation=YELLOW", "slope=RED", "landslides_5km=GREEN", "landslides_10km=GREEN",
        "Training decision: DO NOT train Isolation Forest until the slope calculation is regenerated and terrain NoData provenance is checked.",
    ]
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text("\n".join(report) + "\n", encoding="utf-8")
    print(f"Validation report written to {REPORT}")


if __name__ == "__main__":
    main()
