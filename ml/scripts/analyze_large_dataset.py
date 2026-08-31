"""Chunked integrity and size analysis for risk_features.csv."""
from __future__ import annotations

from collections import Counter
from pathlib import Path

import geopandas as gpd
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
CSV = ROOT / "ml" / "data" / "processed" / "risk_features.csv"
SEGMENTS = ROOT / "ml" / "data" / "processed" / "road_segments.geojson"
REPORT = ROOT / "ml" / "reports" / "dataset_size_analysis.txt"
CHUNK_SIZE = 250_000


def main() -> None:
    rows = 0
    nulls: Counter[str] = Counter()
    segments, osm_ids, dates = set(), set(), set()
    per_date: Counter[str] = Counter()
    duplicate_pairs = duplicate_rows = 0
    current_date = None
    date_pairs, date_rows = set(), set()
    first_chunk_memory = 0
    columns: list[str] | None = None

    for number, chunk in enumerate(pd.read_csv(CSV, chunksize=CHUNK_SIZE), start=1):
        if columns is None:
            columns = chunk.columns.tolist()
            first_chunk_memory = int(chunk.memory_usage(deep=True).sum())
        rows += len(chunk)
        nulls.update(chunk.isna().sum().to_dict())
        segments.update(chunk.road_segment_id.astype(str))
        osm_ids.update(chunk.osm_id.astype(str))
        dates.update(chunk.date.astype(str))
        per_date.update(chunk.date.astype(str))
        # The file is date-sorted. Keep at most one day's hashes in memory so
        # duplicate checks remain exact even when a date crosses a chunk edge.
        for date, day in chunk.groupby("date", sort=False):
            if date != current_date:
                current_date = date
                date_pairs.clear()
                date_rows.clear()
            pair_hashes = pd.util.hash_pandas_object(day[["road_segment_id", "date"]], index=False)
            row_hashes = pd.util.hash_pandas_object(day, index=False)
            duplicate_pairs += int(pair_hashes.duplicated().sum()) + sum(value in date_pairs for value in pair_hashes)
            duplicate_rows += int(row_hashes.duplicated().sum()) + sum(value in date_rows for value in row_hashes)
            date_pairs.update(pair_hashes.tolist())
            date_rows.update(row_hashes.tolist())
        print(f"Analyzed chunk {number}: {rows:,} rows")

    roads = gpd.read_file(SEGMENTS).to_crs("EPSG:6933")
    lengths = roads.length
    estimates = {metres: int((lengths / metres).apply(__import__("math").ceil).clip(lower=1).sum()) for metres in (500, 1_000, 2_000)}
    expected = len(segments) * len(dates)
    file_gib = CSV.stat().st_size / 1024**3
    report = [
        "Dataset size analysis (chunked; the complete CSV was never loaded into pandas at once)",
        f"csv_size_gib={file_gib:.2f}", f"total_rows={rows}", f"columns={columns}",
        f"unique_road_segment_id={len(segments)}", f"unique_osm_id={len(osm_ids)}",
        f"unique_dates={len(dates)}", f"date_range={min(dates)} to {max(dates)}",
        "state_distribution=not available: risk_features.csv has no state column and no boundary join was performed.",
        f"rows_per_segment={rows / len(segments):.2f}", f"rows_per_date_min_max={min(per_date.values())}/{max(per_date.values())}",
        f"segments_x_dates={expected}", f"actual_minus_expected={rows - expected}",
        f"duplicate_road_segment_id_date={duplicate_pairs}", f"duplicate_complete_rows={duplicate_rows}",
        f"missing_percent={{{', '.join(f'{c}: {nulls[c] / rows * 100:.4f}%' for c in columns)}}}",
        f"first_chunk_rows={CHUNK_SIZE}", f"first_chunk_in_memory_mib={first_chunk_memory / 1024**2:.2f}",
        f"estimated_full_csv_pandas_memory_gib={(first_chunk_memory / CHUNK_SIZE * rows) / 1024**3:.2f}",
        f"current_segment_count={len(roads)}", f"segment_length_m_min_mean_median_max={lengths.min():.1f}/{lengths.mean():.1f}/{lengths.median():.1f}/{lengths.max():.1f}",
        f"estimated_segments_at_500m={estimates[500]}", f"estimated_segments_at_1km={estimates[1000]}", f"estimated_segments_at_2km={estimates[2000]}",
        "Size cause: a complete road-segment × date expansion repeats the static road fields 365 times, and CSV repeats text plus full-precision numbers without column compression.",
        "Recommendation: retain full NER coverage in Parquet; use a separate stratified 250k-row ML subset rather than dropping states.",
    ]
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text("\n".join(report) + "\n", encoding="utf-8")
    print(f"Report written to {REPORT}")


if __name__ == "__main__":
    main()
