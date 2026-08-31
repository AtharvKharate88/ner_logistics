"""Create compact Parquet files and a reproducible, stratified ML subset."""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

ROOT = Path(__file__).resolve().parents[2]
PROCESSED = ROOT / "ml" / "data" / "processed"
CSV = PROCESSED / "risk_features.csv"
ROAD_OUT = PROCESSED / "road_features.parquet"
WEATHER_OUT = PROCESSED / "weather_features.parquet"
RISK_OUT = PROCESSED / "risk_features.parquet"
MODEL_OUT = PROCESSED / "risk_model_features.parquet"
REPORT = ROOT / "ml" / "reports" / "optimization_report.txt"
CHUNK_SIZE = 250_000
TARGET_SEGMENTS = 685  # 685 segments × 365 dates = 250,025 observations.


def cast_static(frame: pd.DataFrame) -> pd.DataFrame:
    result = frame.copy()
    result["osm_id"] = pd.to_numeric(result.osm_id, errors="coerce").astype("Int64")
    for column in ("latitude", "longitude"):
        result[column] = pd.to_numeric(result[column], errors="coerce").astype("float64")
    for column in ("elevation", "slope"):
        result[column] = pd.to_numeric(result[column], errors="coerce").astype("float32")
    for column in ("landslides_5km", "landslides_10km"):
        result[column] = pd.to_numeric(result[column], errors="coerce").astype("int16")
    for column in ("road_type", "surface"):
        result[column] = result[column].astype("string")
    return result


def cast_weather(frame: pd.DataFrame) -> pd.DataFrame:
    result = frame.copy()
    result["date"] = pd.to_datetime(result.date).dt.date
    for column in ("rainfall_1d", "rainfall_3d", "rainfall_7d"):
        result[column] = pd.to_numeric(result[column], errors="coerce").astype("float32")
    return result


def write_table(writer: pq.ParquetWriter | None, frame: pd.DataFrame, path: Path) -> pq.ParquetWriter:
    table = pa.Table.from_pandas(frame, preserve_index=False)
    if writer is None:
        writer = pq.ParquetWriter(path, table.schema, compression="zstd", use_dictionary=True)
        writer.write_table(table)
        return writer
    writer.write_table(table)
    return writer


def selected_segments(roads: pd.DataFrame) -> set[str]:
    # Proportional road-type stratification retains all road classes while a
    # stable hash avoids relying on the order in the OSM export.
    roads = roads.dropna(subset=["elevation", "slope"]).reset_index(drop=True)
    selected: list[str] = []
    total = len(roads)
    for _, group in roads.groupby("road_type", dropna=False):
        count = max(1, round(TARGET_SEGMENTS * len(group) / total))
        rank = pd.util.hash_pandas_object(group.road_segment_id, index=False)
        selected.extend(group.assign(_rank=rank).nsmallest(count, "_rank").road_segment_id.astype(str))
    selected_set = set(selected)
    if len(selected_set) < TARGET_SEGMENTS:
        needed = TARGET_SEGMENTS - len(selected_set)
        rank = pd.util.hash_pandas_object(roads.road_segment_id, index=False)
        extras = roads.assign(_rank=rank).loc[lambda frame: ~frame.road_segment_id.isin(selected_set)].nsmallest(needed, "_rank")
        selected_set.update(extras.road_segment_id.astype(str))
    return selected_set


def main() -> None:
    for path in (ROAD_OUT, WEATHER_OUT, RISK_OUT, MODEL_OUT):
        if path.exists():
            path.unlink()
    road_writer = weather_writer = risk_writer = model_writer = None
    static_written = False
    selected: set[str] | None = None
    rows = model_rows = 0

    for number, chunk in enumerate(pd.read_csv(CSV, chunksize=CHUNK_SIZE), start=1):
        static_cols = ["road_segment_id", "osm_id", "latitude", "longitude", "road_type", "surface", "elevation", "slope", "landslides_5km", "landslides_10km"]
        weather_cols = ["road_segment_id", "date", "rainfall_1d", "rainfall_3d", "rainfall_7d"]
        static = cast_static(chunk[static_cols])
        weather = cast_weather(chunk[weather_cols])
        # Rows are already aligned one-for-one within this input chunk.  A
        # merge would create a many-to-many Cartesian product for repeated
        # road IDs and explode memory.
        risk = pd.concat([static.reset_index(drop=True), weather.drop(columns="road_segment_id").reset_index(drop=True)], axis=1)
        if not static_written:
            roads = static.drop_duplicates("road_segment_id").reset_index(drop=True)
            road_writer = write_table(road_writer, roads, ROAD_OUT)
            selected = selected_segments(roads)
            static_written = True
        weather_writer = write_table(weather_writer, weather, WEATHER_OUT)
        risk_writer = write_table(risk_writer, risk, RISK_OUT)
        model = risk[risk.road_segment_id.astype(str).isin(selected)][["road_segment_id", "date", "rainfall_1d", "rainfall_3d", "rainfall_7d", "elevation", "slope", "landslides_5km", "landslides_10km"]]
        model_writer = write_table(model_writer, model, MODEL_OUT)
        rows += len(chunk)
        model_rows += len(model)
        print(f"Optimized chunk {number}: {rows:,} source rows, {model_rows:,} model rows")
    for writer in (road_writer, weather_writer, risk_writer, model_writer):
        if writer is not None:
            writer.close()
    sizes = {name: path.stat().st_size / 1024**2 for name, path in {"csv": CSV, "road_features": ROAD_OUT, "weather_features": WEATHER_OUT, "risk_features": RISK_OUT, "risk_model_features": MODEL_OUT}.items()}
    report = [
        "Dataset optimization report", f"source_csv_mib={sizes['csv']:.2f}", f"risk_features_parquet_mib={sizes['risk_features']:.2f}",
        f"csv_to_parquet_compression_ratio={sizes['csv'] / sizes['risk_features']:.2f}", f"road_features_parquet_mib={sizes['road_features']:.2f}",
        f"weather_features_parquet_mib={sizes['weather_features']:.2f}", f"risk_model_features_parquet_mib={sizes['risk_model_features']:.2f}",
        f"risk_model_feature_rows={model_rows}", f"selected_road_segments={len(selected or set())}",
        "Architecture: road_features is static; weather_features contains time-varying rainfall; risk_features is the compact full denormalized analytical copy.",
        "ML subset: proportional road-type stratified segment sample retaining every 2025 date, not random row deletion.",
        "Recommended first Isolation Forest configuration: n_estimators=200, max_samples=auto, contamination='auto', n_jobs=-1; train on the seven numeric features only after median imputation, StandardScaler, and log1p for rainfall and landslide counts.",
        "Estimated training matrix RAM: roughly 7–20 MiB for 250k × 7 float32 values before model overhead; 16 GB RAM is sufficient for this prototype.",
    ]
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text("\n".join(report) + "\n", encoding="utf-8")
    print(f"Report written to {REPORT}")


if __name__ == "__main__":
    main()
