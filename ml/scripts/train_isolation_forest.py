"""Train Isolation Forest on graph-aligned environmental features."""
from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, StandardScaler


ROOT = Path(__file__).resolve().parents[2]

PROCESSED = ROOT / "ml" / "data" / "processed"

DATA = PROCESSED / "risk_model_features.parquet"
RESULTS = PROCESSED / "environmental_anomaly_scores.parquet"
MODEL = ROOT / "ml" / "models" / "isolation_forest.joblib"


FEATURES = [
    "rainfall_1d",
    "rainfall_3d",
    "rainfall_7d",
    "elevation",
    "slope",
    "landslides_5km",
    "landslides_10km",
]

LOG_COLUMNS = [
    "rainfall_1d",
    "rainfall_3d",
    "rainfall_7d",
    "landslides_5km",
    "landslides_10km",
]


def log_transform(X):
    """Apply log1p only to non-negative skewed features."""
    X = X.copy()

    for column_index in [0, 1, 2, 5, 6]:
        X[:, column_index] = np.log1p(
            np.clip(X[:, column_index], 0, None)
        )

    return X


def main() -> None:

    if not DATA.exists():
        raise FileNotFoundError(
            f"Training dataset not found:\n{DATA}"
        )

    print("=" * 60)
    print("ISOLATION FOREST TRAINING")
    print("=" * 60)

    print(f"Input: {DATA}")

    print("\nLoading dataset...")

    data = pd.read_parquet(
        DATA,
        columns=[
            "road_segment_id",
            "date",
            *FEATURES,
        ],
    )

    print(f"Rows: {len(data):,}")
    print(f"Segments: {data.road_segment_id.nunique():,}")
    print(f"Dates: {data.date.nunique():,}")

    # ---------------------------------------------------------
    # Validate dataset
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
            "Training dataset contains duplicate "
            "road_segment_id/date pairs."
        )

    missing = data[FEATURES].isna().sum()

    print("\nMissing values:")
    print(missing.to_string())

    # ---------------------------------------------------------
    # Prepare features
    # ---------------------------------------------------------

    print("\nPreparing features...")

    X = data[FEATURES].astype("float32").to_numpy()

    print(
        f"Training matrix: "
        f"{X.shape[0]:,} rows × {X.shape[1]} features"
    )

    # ---------------------------------------------------------
    # Pipeline
    # ---------------------------------------------------------

    pipeline = Pipeline(
        [
            (
                "impute",
                SimpleImputer(
                    strategy="median"
                ),
            ),
            (
                "log_transform",
                FunctionTransformer(
                    log_transform,
                    validate=False,
                ),
            ),
            (
                "scale",
                StandardScaler(),
            ),
            (
                "model",
                IsolationForest(
                    n_estimators=200,
                    max_samples="auto",
                    contamination="auto",
                    n_jobs=-1,
                    random_state=42,
                ),
            ),
        ]
    )

    # ---------------------------------------------------------
    # Train
    # ---------------------------------------------------------

    print("\nTraining Isolation Forest...")
    print("This may take some time.")

    pipeline.fit(X)

    print("Training complete.")

    # ---------------------------------------------------------
    # Generate anomaly scores
    # ---------------------------------------------------------

    print("\nGenerating anomaly scores...")

    # sklearn's decision_function:
    # higher = more normal
    #
    # We invert it so:
    # higher environmental_anomaly_score
    # = more anomalous

    scores = -pipeline.decision_function(X)

    print(
        f"Score min:    {scores.min():.6f}"
    )
    print(
        f"Score max:    {scores.max():.6f}"
    )
    print(
        f"Score mean:   {scores.mean():.6f}"
    )
    print(
        f"Score median: {np.median(scores):.6f}"
    )

    # ---------------------------------------------------------
    # Save scores
    # ---------------------------------------------------------

    result = data[
        [
            "road_segment_id",
            "date",
        ]
    ].copy()

    result[
        "environmental_anomaly_score"
    ] = scores.astype("float32")

    RESULTS.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    result.to_parquet(
        RESULTS,
        index=False,
        compression="zstd",
    )

    # ---------------------------------------------------------
    # Save model
    # ---------------------------------------------------------

    MODEL.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    joblib.dump(
        pipeline,
        MODEL,
        compress=3,
    )

    # ---------------------------------------------------------
    # Final validation
    # ---------------------------------------------------------

    print("\nValidating output...")

    check = pd.read_parquet(
        RESULTS
    )

    print(
        f"Output rows: "
        f"{len(check):,}"
    )

    print(
        f"Output segments: "
        f"{check.road_segment_id.nunique():,}"
    )

    print(
        f"Output dates: "
        f"{check.date.nunique():,}"
    )

    print(
        f"Output missing scores: "
        f"{check.environmental_anomaly_score.isna().sum():,}"
    )

    output_duplicates = int(
        check.duplicated(
            ["road_segment_id", "date"]
        ).sum()
    )

    print(
        f"Output duplicate pairs: "
        f"{output_duplicates:,}"
    )

    if len(check) != len(data):
        raise ValueError(
            "Output row count does not match input."
        )

    if check.environmental_anomaly_score.isna().any():
        raise ValueError(
            "Anomaly scores contain NaN values."
        )

    if output_duplicates:
        raise ValueError(
            "Output contains duplicate segment/date pairs."
        )

    print("\n" + "=" * 60)
    print("ISOLATION FOREST COMPLETE")
    print("=" * 60)

    print(f"Model:   {MODEL}")
    print(f"Scores:  {RESULTS}")
    print(
        f"Rows:    {len(result):,}"
    )
    print(
        f"Features: {len(FEATURES)}"
    )

    print("\nFeatures used:")
    for feature in FEATURES:
        print(f"  - {feature}")


if __name__ == "__main__":
    main()