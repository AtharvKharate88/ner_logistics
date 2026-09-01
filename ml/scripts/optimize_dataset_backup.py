"""Create graph-aligned ML features from the full risk feature dataset."""
from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd


# ============================================================
# PATHS
# ============================================================

ROOT = Path(__file__).resolve().parents[2]

PROCESSED = ROOT / "ml" / "data" / "processed"

GRAPH_PATH = (
    ROOT
    / "route-engine"
    / "data"
    / "graph"
    / "road_graph.joblib"
)

INPUT = PROCESSED / "risk_features.parquet"

MODEL_OUT = (
    PROCESSED
    / "risk_model_features.parquet"
)

REPORT = (
    ROOT
    / "ml"
    / "reports"
    / "optimization_report.txt"
)


# ============================================================
# ML FEATURES
# ============================================================

FEATURES = [
    "rainfall_1d",
    "rainfall_3d",
    "rainfall_7d",
    "elevation",
    "slope",
    "landslides_5km",
    "landslides_10km",
]


# ============================================================
# LOAD GRAPH SEGMENT IDs
# ============================================================

def load_graph_segment_ids() -> set[str]:
    print("Loading routing graph...")

    graph = joblib.load(GRAPH_PATH)

    graph_ids = {
        str(data["road_segment_id"])
        for _, _, data in graph.edges(data=True)
        if data.get("road_segment_id") is not None
    }

    print(
        f"Graph segments: "
        f"{len(graph_ids):,}"
    )

    return graph_ids


# ============================================================
# MAIN
# ============================================================

def main() -> None:

    # --------------------------------------------------------
    # Check input files
    # --------------------------------------------------------

    if not INPUT.exists():
        raise FileNotFoundError(
            f"Risk feature dataset not found: {INPUT}"
        )

    if not GRAPH_PATH.exists():
        raise FileNotFoundError(
            f"Routing graph not found: {GRAPH_PATH}"
        )

    # --------------------------------------------------------
    # Load graph IDs
    # --------------------------------------------------------

    graph_ids = load_graph_segment_ids()

    if not graph_ids:
        raise ValueError(
            "No road_segment_id values were found in the routing graph."
        )

    # --------------------------------------------------------
    # Load full risk feature dataset
    # --------------------------------------------------------

    print()
    print("Loading risk features...")

    columns = [
        "road_segment_id",
        "date",
        *FEATURES,
    ]

    data = pd.read_parquet(
        INPUT,
        columns=columns,
    )

    data["road_segment_id"] = (
        data["road_segment_id"]
        .astype(str)
    )

    data["date"] = pd.to_datetime(
        data["date"],
        errors="coerce",
    ).dt.date

    # Make sure ML columns are numeric.
    for column in FEATURES:
        data[column] = pd.to_numeric(
            data[column],
            errors="coerce",
        )

    print(
        f"Risk feature rows: "
        f"{len(data):,}"
    )

    print(
        f"Risk feature segments: "
        f"{data['road_segment_id'].nunique():,}"
    )

    # --------------------------------------------------------
    # Validate date column
    # --------------------------------------------------------

    invalid_dates = int(
        data["date"].isna().sum()
    )

    if invalid_dates:
        raise ValueError(
            f"Found {invalid_dates:,} rows with invalid dates."
        )

    # --------------------------------------------------------
    # Align with routing graph
    # --------------------------------------------------------

    print()
    print("Graph alignment...")

    model = data[
        data["road_segment_id"].isin(graph_ids)
    ].copy()

    model.reset_index(
        drop=True,
        inplace=True,
    )

    usable_segments = set(
        model["road_segment_id"]
    )

    missing_graph_segments = (
        graph_ids
        - usable_segments
    )

    extra_feature_segments = (
        set(data["road_segment_id"])
        - graph_ids
    )

    print(
        f"Graph segments: "
        f"{len(graph_ids):,}"
    )

    print(
        f"Usable graph segments: "
        f"{len(usable_segments):,}"
    )

    print(
        f"Missing graph segments: "
        f"{len(missing_graph_segments):,}"
    )

    print(
        f"Extra feature segments removed: "
        f"{len(extra_feature_segments):,}"
    )

    if not usable_segments:
        raise ValueError(
            "No routing graph segments overlap with risk_features.parquet."
        )

    # --------------------------------------------------------
    # Validate segment/date pairs
    # --------------------------------------------------------

    print()
    print("Validating segment/date uniqueness...")

    duplicate_pairs = int(
        model.duplicated(
            [
                "road_segment_id",
                "date",
            ]
        ).sum()
    )

    print(
        f"Duplicate segment/date pairs: "
        f"{duplicate_pairs:,}"
    )

    if duplicate_pairs:
        raise ValueError(
            f"Found {duplicate_pairs:,} duplicate "
            "road_segment_id/date pairs."
        )

    # --------------------------------------------------------
    # Date coverage
    # --------------------------------------------------------

    rows_per_segment = (
        model
        .groupby("road_segment_id")
        .size()
    )

    unique_dates = model["date"].nunique()

    print()
    print("Date coverage:")

    print(
        f"Date range: "
        f"{model['date'].min()} -> "
        f"{model['date'].max()}"
    )

    print(
        f"Unique dates: "
        f"{unique_dates:,}"
    )

    print()
    print("Rows per segment:")

    print(
        rows_per_segment
        .describe()
        .to_string()
    )

    # --------------------------------------------------------
    # Every usable graph segment should have 365 dates.
    # --------------------------------------------------------

    bad_segments = rows_per_segment[
        rows_per_segment != 365
    ]

    if not bad_segments.empty:

        print()
        print(
            f"WARNING: "
            f"{len(bad_segments):,} segments do not have 365 rows."
        )

        print(
            bad_segments.head(20)
            .to_string()
        )

        raise ValueError(
            "Some graph-aligned segments do not have "
            "365 observations."
        )

    # --------------------------------------------------------
    # Validate expected dates
    # --------------------------------------------------------

    expected_dates = pd.date_range(
        "2025-01-01",
        "2025-12-31",
        freq="D",
    ).date

    actual_dates = set(
        model["date"].unique()
    )

    missing_dates = (
        set(expected_dates)
        - actual_dates
    )

    extra_dates = (
        actual_dates
        - set(expected_dates)
    )

    print()
    print(
        f"Missing expected dates: "
        f"{len(missing_dates):,}"
    )

    print(
        f"Unexpected dates: "
        f"{len(extra_dates):,}"
    )

    if missing_dates:
        raise ValueError(
            "The graph-aligned dataset is missing expected 2025 dates."
        )

    if extra_dates:
        raise ValueError(
            "The graph-aligned dataset contains dates outside 2025."
        )

    # --------------------------------------------------------
    # Validate ML feature columns
    # --------------------------------------------------------

    print()
    print("Validating ML features...")

    missing_columns = [
        column
        for column in FEATURES
        if column not in model.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing ML feature columns: "
            f"{missing_columns}"
        )

    print(
        "Feature missing-value counts:"
    )

    for column in FEATURES:

        missing_count = int(
            model[column]
            .isna()
            .sum()
        )

        print(
            f"  {column}: "
            f"{missing_count:,}"
        )

    # --------------------------------------------------------
    # Save output
    # --------------------------------------------------------

    print()
    print("Saving graph-aligned ML dataset...")

    MODEL_OUT.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    if MODEL_OUT.exists():
        MODEL_OUT.unlink()

    output_columns = [
        "road_segment_id",
        "date",
        *FEATURES,
    ]

    model[
        output_columns
    ].to_parquet(
        MODEL_OUT,
        index=False,
        compression="zstd",
    )

    # --------------------------------------------------------
    # Calculate coverage
    # --------------------------------------------------------

    graph_coverage = (
        len(usable_segments)
        / len(graph_ids)
        * 100.0
    )

    # --------------------------------------------------------
    # Report
    # --------------------------------------------------------

    report = [
        "Graph-aligned ML dataset report",
        "",
        f"graph_segments={len(graph_ids)}",
        f"risk_feature_segments={data['road_segment_id'].nunique()}",
        f"usable_graph_segments={len(usable_segments)}",
        f"missing_graph_segments={len(missing_graph_segments)}",
        f"extra_feature_segments_removed={len(extra_feature_segments)}",
        f"graph_segment_coverage_percent={graph_coverage:.2f}",
        f"model_rows={len(model)}",
        f"unique_dates={unique_dates}",
        f"duplicate_segment_date_pairs={duplicate_pairs}",
        f"date_min={model['date'].min()}",
        f"date_max={model['date'].max()}",
        f"model_output={MODEL_OUT}",
        "",
        "Architecture:",
        "risk_features.parquet remains the full 74,100-segment feature dataset.",
        "risk_model_features.parquet contains only segments present in the routing graph.",
        "Every usable graph segment retains all 365 dates.",
        "",
        "ML features:",
        ", ".join(FEATURES),
        "",
        "Expected model rows:",
        f"{len(usable_segments)} segments x 365 dates = "
        f"{len(usable_segments) * 365:,} rows.",
    ]

    REPORT.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    REPORT.write_text(
        "\n".join(report) + "\n",
        encoding="utf-8",
    )

    # --------------------------------------------------------
    # Final output
    # --------------------------------------------------------

    print()
    print("=" * 60)
    print("GRAPH-ALIGNED ML DATASET COMPLETE")
    print("=" * 60)

    print(
        f"Graph segments: "
        f"{len(graph_ids):,}"
    )

    print(
        f"Usable segments: "
        f"{len(usable_segments):,}"
    )

    print(
        f"Missing graph segments: "
        f"{len(missing_graph_segments):,}"
    )

    print(
        f"Graph coverage: "
        f"{graph_coverage:.2f}%"
    )

    print(
        f"Dates: "
        f"{unique_dates}"
    )

    print(
        f"Rows: "
        f"{len(model):,}"
    )

    print(
        f"Expected rows: "
        f"{len(usable_segments) * 365:,}"
    )

    print(
        f"Output: "
        f"{MODEL_OUT}"
    )

    print(
        f"Report: "
        f"{REPORT}"
    )


if __name__ == "__main__":
    main()