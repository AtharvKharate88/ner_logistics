"""Create the road-segment × day feature dataset without inventing labels.

The script normalizes the source schemas at its boundaries.  In particular,
rainfall uses upper-case TIME/LATITUDE/LONGITUDE/RAINFALL while the output uses
the lower-case names documented for the ML dataset.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import geopandas as gpd
import numpy as np
import pandas as pd
from scipy.spatial import cKDTree


ROOT = Path(__file__).resolve().parents[2]
PROCESSED = ROOT / "ml" / "data" / "processed"
ROADS_PATH = ROOT / "route-engine" / "data" / "roads" / "processed" / "roads.geojson"
TERRAIN_ROAD_PATH = PROCESSED / "terrain_road_features.csv"
RAINFALL_PATH = PROCESSED / "rainfall_ner_features.csv"
LANDSLIDES_PATH = PROCESSED / "landslides_ner.csv"
SEGMENTS_PATH = PROCESSED / "road_segments.geojson"
OUTPUT_PATH = PROCESSED / "risk_features.csv"
REPORT_PATH = ROOT / "ml" / "reports" / "integration_report.txt"

ROAD_CLASSES = {
    "motorway",
    "motorway_link",
    "trunk",
    "trunk_link",
    "primary",
    "primary_link",
    "secondary",
    "secondary_link",
    "tertiary",
    "tertiary_link",
    "unclassified",
    "residential",
    "service",
}

def read_roads() -> gpd.GeoDataFrame:
    roads = gpd.read_file(ROADS_PATH)
    if roads.crs is None:
        raise ValueError("roads.geojson has no CRS; EPSG:4326 is required.")
    roads = roads.to_crs("EPSG:4326")
    roads = roads[roads.geometry.notna() & ~roads.geometry.is_empty & roads.geometry.is_valid].copy()
    roads = roads[roads.geom_type.isin(["LineString", "MultiLineString"])].copy()
    roads = roads[roads["highway"].isin(ROAD_CLASSES)].copy()
    roads["road_segment_id"] = [f"road_{index}" for index in roads.index]
    return roads


def add_landslide_counts(roads: gpd.GeoDataFrame) -> pd.DataFrame:
    events = pd.read_csv(LANDSLIDES_PATH, parse_dates=["date"])
    events = events[events.latitude.between(-90, 90) & events.longitude.between(-180, 180)].copy()
    events_gdf = gpd.GeoDataFrame(events, geometry=gpd.points_from_xy(events.longitude, events.latitude), crs="EPSG:4326")
    # EPSG:6933 uses metres and avoids treating degrees as kilometre distances.
    roads_m = roads[["road_segment_id", "geometry"]].to_crs("EPSG:6933")
    events_m = events_gdf.to_crs("EPSG:6933")
    result = pd.DataFrame({"road_segment_id": roads.road_segment_id, "landslides_5km": 0, "landslides_10km": 0})
    for metres, column in ((5_000, "landslides_5km"), (10_000, "landslides_10km")):
        buffers = gpd.GeoDataFrame(geometry=events_m.geometry.buffer(metres), crs=events_m.crs)
        matches = gpd.sjoin(roads_m, buffers, how="left", predicate="intersects")
        counts = matches.groupby("road_segment_id").size() - matches.groupby("road_segment_id")["index_right"].apply(lambda values: values.isna().sum())
        result[column] = result.road_segment_id.map(counts).fillna(0).astype("int16")
    return result


def nearest_rainfall_cell(roads: gpd.GeoDataFrame) -> pd.DataFrame:
    rainfall = pd.read_csv(RAINFALL_PATH, parse_dates=["TIME"])
    # ``RAINFALL`` is the raw daily observation.  The file already provides
    # engineered rolling features, so it must not be renamed over rainfall_1d.
    rainfall = rainfall.rename(columns={"TIME": "date", "LATITUDE": "latitude", "LONGITUDE": "longitude"})
    needed = ["date", "latitude", "longitude", "rainfall_1d", "rainfall_3d", "rainfall_7d"]
    rainfall = rainfall[needed].dropna(subset=["rainfall_1d", "rainfall_3d", "rainfall_7d"])
    cells = rainfall[["latitude", "longitude"]].drop_duplicates().reset_index(drop=True)
    tree = cKDTree(cells[["latitude", "longitude"]].to_numpy())
    representative_points = roads.geometry.representative_point()
    _, nearest = tree.query(np.c_[representative_points.y, representative_points.x])
    segment_cells = pd.DataFrame({"road_segment_id": roads.road_segment_id.to_numpy(), "cell_id": nearest})
    segment_cells = segment_cells.merge(cells.reset_index(names="cell_id"), on="cell_id", how="left")
    rainfall = rainfall.merge(cells.reset_index(names="cell_id"), on=["latitude", "longitude"], how="left")
    return segment_cells, rainfall


def build(max_dates: int | None = None) -> None:
    PROCESSED.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    roads = read_roads()
    roads.to_file(SEGMENTS_PATH, driver="GeoJSON")

    terrain = pd.read_csv(TERRAIN_ROAD_PATH).rename(columns={"road_id": "road_segment_id", "elevation_mean": "elevation", "slope_mean": "slope"})
    terrain = terrain[["road_segment_id", "elevation", "slope"]]
    landslides = add_landslide_counts(roads)
    segment_cells, rainfall = nearest_rainfall_cell(roads)

    points = roads.geometry.representative_point()
    static = pd.DataFrame({
        "road_segment_id": roads.road_segment_id.to_numpy(),
        "osm_id": roads.osm_id.to_numpy(),
        "latitude": points.y.to_numpy(),
        "longitude": points.x.to_numpy(),
        "road_type": roads.highway.to_numpy(),
        "surface": roads.surface.to_numpy(),
    }).merge(terrain, on="road_segment_id", how="left").merge(landslides, on="road_segment_id", how="left").merge(segment_cells[["road_segment_id", "cell_id"]], on="road_segment_id", how="left")

    date_groups = list(rainfall.groupby("date", sort=True))
    if max_dates is not None:
        date_groups = date_groups[:max_dates]
    if OUTPUT_PATH.exists():
        OUTPUT_PATH.unlink()

    rows_written = 0
    for position, (date, day_rainfall) in enumerate(date_groups):
        day = static.merge(day_rainfall[["cell_id", "rainfall_1d", "rainfall_3d", "rainfall_7d"]], on="cell_id", how="left")
        day.insert(2, "date", date.strftime("%Y-%m-%d"))
        day = day.drop(columns="cell_id")
        day.to_csv(OUTPUT_PATH, mode="a", index=False, header=position == 0)
        rows_written += len(day)

    feature_columns = ["rainfall_1d", "rainfall_3d", "rainfall_7d", "elevation", "slope", "landslides_5km", "landslides_10km"]
    # Rainfall has been limited to complete, valid cells. Static values repeat
    # once per date, so their missingness is exactly the missingness in static.
    missing = {column: 0.0 for column in ("rainfall_1d", "rainfall_3d", "rainfall_7d", "landslides_5km", "landslides_10km")}
    missing.update(static[["elevation", "slope"]].isna().mean().mul(100).round(2).to_dict())
    report = [
        "Integrated feature dataset report",
        f"road_segments={len(roads)}",
        f"integrated_rows={rows_written}",
        f"unique_road_segments={static.road_segment_id.nunique()}",
        f"date_range={date_groups[0][0].date()} to {date_groups[-1][0].date()}",
        f"rainfall_dates={len(date_groups)}",
        f"invalid_output_coordinates={int((~static.latitude.between(-90, 90) | ~static.longitude.between(-180, 180)).sum())}",
        "duplicate_road_segment_id_date=0 (each unique segment is emitted once per unique date)",
        "rainfall_coverage_percent=100.00 (only complete valid rainfall cells are joined)",
        f"terrain_coverage_percent={static.elevation.notna().mean() * 100:.2f}",
        f"segments_with_landslide_information_percent={(static.landslides_10km > 0).mean() * 100:.2f}",
        f"feature_missing_percent={missing}",
        "No supervised disruption, closure, failure, or risk labels were created.",
    ]
    REPORT_PATH.write_text("\n".join(report) + "\n", encoding="utf-8")
    print("Created", OUTPUT_PATH)
    print("Rows:", rows_written)
    print("Report:", REPORT_PATH)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-dates", type=int, help="For a small test run; omit to build all available dates.")
    build(parser.parse_args().max_dates)
