"""Train later, after reviewing the optimized dataset; not run by optimization."""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, StandardScaler
import joblib

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "ml" / "data" / "processed" / "risk_model_features.parquet"
MODEL = ROOT / "ml" / "models" / "isolation_forest.joblib"
RESULTS = ROOT / "ml" / "data" / "processed" / "environmental_anomaly_scores.parquet"
FEATURES = ["rainfall_1d", "rainfall_3d", "rainfall_7d", "elevation", "slope", "landslides_5km", "landslides_10km"]


def main() -> None:
    data = pd.read_parquet(DATA, columns=["road_segment_id", "date", *FEATURES])
    # Log transform non-negative skewed exposure variables, then impute and scale.
    log_columns = ["rainfall_1d", "rainfall_3d", "rainfall_7d", "landslides_5km", "landslides_10km"]
    X = data[FEATURES].copy()
    X[log_columns] = np.log1p(X[log_columns].clip(lower=0))
    pipeline = Pipeline([("impute", SimpleImputer(strategy="median")), ("scale", StandardScaler()), ("model", IsolationForest(n_estimators=200, max_samples="auto", contamination="auto", n_jobs=-1, random_state=42))])
    pipeline.fit(X)
    score = -pipeline.decision_function(X)
    result = data[["road_segment_id", "date"]].copy()
    result["environmental_anomaly_score"] = score.astype("float32")
    MODEL.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODEL)
    result.to_parquet(RESULTS, index=False, compression="zstd")
    print(f"Saved {MODEL} and {RESULTS}. Scores are anomaly indicators, not road-closure probabilities.")


if __name__ == "__main__":
    main()
