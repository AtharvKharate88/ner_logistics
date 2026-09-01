"""Convert Isolation Forest anomaly scores into routing risk predictions."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[2]

PROCESSED = ROOT / "ml" / "data" / "processed"

INPUT = PROCESSED / "environmental_anomaly_scores.parquet"
OUTPUT = PROCESSED / "risk_predictions.parquet"


HIGH_RISK_THRESHOLD = 80.0
MEDIUM_RISK_THRESHOLD = 50.0


def main() -> None:
    if not INPUT.exists():
        raise FileNotFoundError(
            f"Anomaly score file not found:\n{INPUT}"
        )

    print("=" * 60)
    print("GENERATING RISK PREDICTIONS")
    print("=" * 60)

    print(f"Input: {INPUT}")

    print("\nLoading anomaly scores...")

    data = pd.read_parquet(
        INPUT,
        columns=[
            "road_segment_id",
            "date",
            "environmental_anomaly_score",
        ],
    )

    print(f"Rows: {len(data):,}")
    print(
        f"Segments: "
        f"{data['road_segment_id'].nunique():,}"
    )
    print(
        f"Dates: "
        f"{data['date'].nunique():,}"
    )

    # ---------------------------------------------------------
    # Validate input
    # ---------------------------------------------------------

    duplicate_pairs = int(
        data.duplicated(
            ["road_segment_id", "date"]
        ).sum()
    )

    print(
        f"Duplicate segment/date pairs: "
        f"{duplicate_pairs:,}"
    )

    if duplicate_pairs:
        raise ValueError(
            "Input contains duplicate "
            "road_segment_id/date pairs."
        )

    if data["environmental_anomaly_score"].isna().any():
        raise ValueError(
            "Input contains missing anomaly scores."
        )

    # ---------------------------------------------------------
    # Convert anomaly score → risk score
    # ---------------------------------------------------------
    #
    # Higher anomaly score = more environmental anomaly.
    #
    # We rank the scores globally and convert them to a
    # percentile-based 0–100 risk score.
    #
    # This preserves the ordering:
    #
    # low anomaly    → low risk
    # high anomaly   → high risk
    #
    # Percentile ranking also avoids depending on the raw
    # Isolation Forest score range.
    # ---------------------------------------------------------

    print("\nConverting anomaly scores to risk scores...")

    anomaly = data[
        "environmental_anomaly_score"
    ].astype("float64")

    risk_score = (
        anomaly.rank(
            method="average",
            pct=True,
        )
        * 100.0
    )

    data["risk_score"] = risk_score.astype("float32")

    # ---------------------------------------------------------
    # Risk classification
    # ---------------------------------------------------------

    data["risk_level"] = np.select(
        [
            data["risk_score"] >= HIGH_RISK_THRESHOLD,
            data["risk_score"] >= MEDIUM_RISK_THRESHOLD,
        ],
        [
            "HIGH",
            "MEDIUM",
        ],
        default="LOW",
    )

    # ---------------------------------------------------------
    # Build routing-compatible output
    # ---------------------------------------------------------

    result = data[
        [
            "road_segment_id",
            "date",
            "environmental_anomaly_score",
            "risk_score",
            "risk_level",
        ]
    ].rename(
        columns={
            "environmental_anomaly_score": "anomaly_score",
        }
    )

    # ---------------------------------------------------------
    # Validation
    # ---------------------------------------------------------

    print("\nValidating generated predictions...")

    if result["risk_score"].isna().any():
        raise ValueError(
            "Generated risk scores contain NaN values."
        )

    if result["risk_level"].isna().any():
        raise ValueError(
            "Generated risk levels contain NaN values."
        )

    duplicate_output = int(
        result.duplicated(
            ["road_segment_id", "date"]
        ).sum()
    )

    if duplicate_output:
        raise ValueError(
            "Generated predictions contain duplicate "
            "segment/date pairs."
        )

    print(
        f"Output rows: "
        f"{len(result):,}"
    )

    print(
        f"Output segments: "
        f"{result['road_segment_id'].nunique():,}"
    )

    print(
        f"Output dates: "
        f"{result['date'].nunique():,}"
    )

    print(
        f"Output missing scores: "
        f"{result['risk_score'].isna().sum():,}"
    )

    print(
        f"Duplicate pairs: "
        f"{duplicate_output:,}"
    )

    print("\nRisk score statistics:")
    print(
        result["risk_score"].describe().to_string()
    )

    print("\nRisk levels:")
    print(
        result["risk_level"]
        .value_counts()
        .to_string()
    )

    # ---------------------------------------------------------
    # Save
    # ---------------------------------------------------------

    OUTPUT.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    if OUTPUT.exists():
        OUTPUT.unlink()

    result.to_parquet(
        OUTPUT,
        index=False,
        compression="zstd",
    )

    print("\n" + "=" * 60)
    print("RISK PREDICTIONS COMPLETE")
    print("=" * 60)

    print(f"Output: {OUTPUT}")
    print(
        f"Rows:   {len(result):,}"
    )
    print(
        f"Segments: "
        f"{result['road_segment_id'].nunique():,}"
    )
    print(
        f"Dates: "
        f"{result['date'].nunique():,}"
    )


if __name__ == "__main__":
    main()