"""Create a graph-aligned ML dataset from the full risk feature dataset."""

from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq


ROOT = Path(__file__).resolve().parents[2]

PROCESSED = ROOT / "ml" / "data" / "processed"

INPUT = PROCESSED / "risk_features.csv"
MODEL_OUT = PROCESSED / "risk_model_features.parquet"
REPORT = ROOT / "ml" / "reports" / "optimization_report.txt"

GRAPH_PATH = (
    ROOT
    / "route-engine"
    / "data"
    / "graph"
    / "road_graph.joblib"
)

CHUNK_SIZE = 250_000

FEATURES = [
    "rainfall_1d",
    "rainfall_3d",
    "rainfall_7d",
    "elevation",
    "slope",
    "landslides_5km",
    "landslides_10km",
]


def load_graph_segment_ids() -> set[str]:
    print("Loading routing graph...")

    graph = joblib.load(GRAPH_PATH)

    graph_ids = {
        str(data["road_segment_id"])
        for _, _, data in graph.edges(data=True)
        if data.get("road_segment_id") is not None
    }

    print(f"Graph segments: {len(graph_ids):,}")

    return graph_ids


def main() -> None:
    if not INPUT.exists():
        raise FileNotFoundError(
            f"Risk feature CSV not found: {INPUT}"
        )

    if not GRAPH_PATH.exists():
        raise FileNotFoundError(
            f"Routing graph not found: {GRAPH_PATH}"
        )

    graph_ids = load_graph_segment_ids()

    if not graph_ids:
        raise ValueError("No road_segment_id values found in routing graph.")

    if MODEL_OUT.exists():
        MODEL_OUT.unlink()

    print()
    print("Processing risk feature CSV in chunks...")

    columns = [
        "road_segment_id",
        "date",
        *FEATURES,
    ]

    writer: pq.ParquetWriter | None = None

    total_rows = 0
    selected_rows = 0

    usable_segments: set[str] = set()

    for number, chunk in enumerate(
        pd.read_csv(
            INPUT,
            usecols=columns,
            chunksize=CHUNK_SIZE,
        ),
        start=1,
    ):
        total_rows += len(chunk)

        chunk["road_segment_id"] = (
            chunk["road_segment_id"].astype(str)
        )

        # Keep only roads present in routing graph.
        model = chunk[
            chunk["road_segment_id"].isin(graph_ids)
        ].copy()

        if model.empty:
            print(
                f"Chunk {number}: "
                f"{total_rows:,} source rows, "
                f"0 graph-aligned rows"
            )
            continue

        model["date"] = pd.to_datetime(
            model["date"]
        ).dt.date

        usable_segments.update(
            model["road_segment_id"].unique()
        )

        selected_rows += len(model)

        table = pa.Table.from_pandas(
            model,
            preserve_index=False,
        )

        if writer is None:
            writer = pq.ParquetWriter(
                MODEL_OUT,
                table.schema,
                compression="zstd",
                use_dictionary=True,
            )

        writer.write_table(table)

        print(
            f"Chunk {number}: "
            f"{total_rows:,} source rows, "
            f"{selected_rows:,} graph-aligned rows"
        )

    if writer is not None:
        writer.close()

    if selected_rows == 0:
        raise ValueError(
            "No graph segments were found in risk_features.csv."
        )

    print()
    print("Validating generated dataset...")

    model = pd.read_parquet(MODEL_OUT)

    duplicate_pairs = int(
        model.duplicated(
            ["road_segment_id", "date"]
        ).sum()
    )

    if duplicate_pairs:
        raise ValueError(
            f"Found {duplicate_pairs:,} duplicate "
            "road_segment_id/date pairs."
        )

    rows_per_segment = (
        model.groupby("road_segment_id")
        .size()
    )

    bad_segments = rows_per_segment[
        rows_per_segment != 365
    ]

    print()
    print("============================================================")
    print("GRAPH-ALIGNED ML DATASET")
    print("============================================================")

    print(f"Source rows:              {total_rows:,}")
    print(f"Graph segments:           {len(graph_ids):,}")
    print(f"Usable graph segments:    {len(usable_segments):,}")
    print(
        f"Missing graph segments:   "
        f"{len(graph_ids - usable_segments):,}"
    )
    print(f"Output rows:              {len(model):,}")
    print(f"Unique dates:             {model.date.nunique():,}")
    print(f"Date range:               {model.date.min()} -> {model.date.max()}")
    print(f"Duplicate segment/date:   {duplicate_pairs:,}")

    print()
    print("Rows per segment:")
    print(rows_per_segment.describe().to_string())

    if not bad_segments.empty:
        print()
        print(
            f"WARNING: {len(bad_segments):,} segments "
            "do not contain all 365 dates."
        )
        print(bad_segments.head(20).to_string())
    else:
        print()
        print("All usable graph segments contain 365 dates.")

    graph_coverage = (
        len(usable_segments)
        / len(graph_ids)
        * 100.0
    )

    report = [
        "Graph-aligned ML dataset report",
        "",
        f"source_rows={total_rows}",
        f"graph_segments={len(graph_ids)}",
        f"usable_graph_segments={len(usable_segments)}",
        f"missing_graph_segments={len(graph_ids - usable_segments)}",
        f"graph_segment_coverage_percent={graph_coverage:.2f}",
        f"model_rows={len(model)}",
        f"unique_dates={model.date.nunique()}",
        f"duplicate_segment_date_pairs={duplicate_pairs}",
        f"date_min={model.date.min()}",
        f"date_max={model.date.max()}",
        f"segments_with_365_dates={len(rows_per_segment[rows_per_segment == 365])}",
        f"segments_not_365_dates={len(bad_segments)}",
        f"model_output={MODEL_OUT}",
        "",
        "Architecture:",
        "risk_features.csv contains the complete 253,122-segment × 365-day dataset.",
        "risk_model_features.parquet contains only road segments present in the routing graph.",
        "All available dates are retained for each graph-aligned segment.",
        "",
        "ML features:",
        ", ".join(FEATURES),
    ]

    REPORT.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    REPORT.write_text(
        "\n".join(report) + "\n",
        encoding="utf-8",
    )

    print()
    print("============================================================")
    print("COMPLETE")
    print("============================================================")
    print(f"Graph coverage: {graph_coverage:.2f}%")
    print(f"Output: {MODEL_OUT}")
    print(f"Report: {REPORT}")


if __name__ == "__main__":
    main()