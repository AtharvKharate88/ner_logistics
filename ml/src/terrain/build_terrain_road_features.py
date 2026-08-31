from __future__ import annotations

from pathlib import Path

import geopandas as gpd
import numpy as np
import pandas as pd
import rasterio
from rasterio.transform import rowcol


REPO_ROOT = Path(__file__).resolve().parents[3]
DEM_PATH = REPO_ROOT / "ml" / "data" / "raw" / "dem" / "_ags_f2ad3cff_a810_4a87_a672_91d67464067f.tif"
ROADS_PATH = REPO_ROOT / "route-engine" / "data" / "roads" / "processed" / "roads.geojson"
OUTPUT_PATH = REPO_ROOT / "ml" / "data" / "processed" / "terrain_road_features.csv"


def iter_line_geometries(geom):
    if geom is None or geom.is_empty:
        return []
    if geom.geom_type == "LineString":
        return [geom]
    if geom.geom_type == "MultiLineString":
        return list(geom.geoms)
    return []


def slope_degrees_from_dem(elevation: np.ndarray, transform, is_geographic: bool) -> np.ndarray:
    """Calculate slope in physical units, retaining NoData as NaN."""
    dz_drow, dz_dcol = np.gradient(elevation)
    x_resolution, y_resolution = transform.a, transform.e
    if is_geographic:
        # DEM values are metres while the WGS84 grid is degrees. Convert the
        # local horizontal pixel size to metres before taking rise/run.
        row_numbers = np.arange(elevation.shape[0]) + 0.5
        latitude = transform.f + row_numbers * y_resolution
        radians = np.deg2rad(latitude)
        metres_per_degree_lat = 111132.92 - 559.82 * np.cos(2 * radians) + 1.175 * np.cos(4 * radians)
        metres_per_degree_lon = 111412.84 * np.cos(radians) - 93.5 * np.cos(3 * radians)
        dy_metres = abs(y_resolution) * metres_per_degree_lat[:, None]
        dx_metres = abs(x_resolution) * metres_per_degree_lon[:, None]
        dz_dy = dz_drow / dy_metres
        dz_dx = dz_dcol / dx_metres
    else:
        dz_dy = dz_drow / abs(y_resolution)
        dz_dx = dz_dcol / abs(x_resolution)
    return np.degrees(np.arctan(np.hypot(dz_dx, dz_dy)))


def build_terrain_features():
    if not DEM_PATH.exists():
        raise FileNotFoundError(f"DEM not found: {DEM_PATH}")
    if not ROADS_PATH.exists():
        raise FileNotFoundError(f"Roads file not found: {ROADS_PATH}")

    with rasterio.open(DEM_PATH) as src:
        elevation = src.read(1).astype(np.float64)
        nodata = src.nodata
        if nodata is not None:
            elevation[elevation == nodata] = np.nan
        # The DEM lacks a declared NoData value, but 65.68% of its cells are
        # exactly zero across the rectangular bounding box. In this NER DEM
        # those cells are outside valid coverage, not real road elevation.
        elevation[elevation == 0] = np.nan
        elevation[np.logical_not(np.isfinite(elevation))] = np.nan

        slope_deg = slope_degrees_from_dem(elevation, src.transform, src.crs.is_geographic)

        roads = gpd.read_file(ROADS_PATH)
        if roads.crs is None:
            roads = roads.set_crs(src.crs)
        elif roads.crs != src.crs:
            roads = roads.to_crs(src.crs)

        roads = roads[roads.geometry.notna() & ~roads.geometry.is_empty].copy()
        roads = roads[roads.geometry.geom_type.isin(["LineString", "MultiLineString"])].copy()

        if "road_id" not in roads.columns:
            roads["road_id"] = roads.index.map(lambda idx: f"road_{idx}")

        road_rows = []

        for idx, row in roads.iterrows():
            line_geoms = iter_line_geometries(row.geometry)
            if not line_geoms:
                continue

            sampled_values = []
            for line in line_geoms:
                if line.length == 0:
                    continue

                sample_count = max(8, min(32, int(np.ceil(line.length / 500.0)) + 1))
                distances = np.linspace(0, line.length, sample_count)

                for dist in distances:
                    point = line.interpolate(dist)
                    x, y = point.x, point.y
                    try:
                        row_idx, col_idx = rowcol(src.transform, x, y)
                    except Exception:
                        continue

                    if row_idx < 0 or row_idx >= src.height or col_idx < 0 or col_idx >= src.width:
                        continue

                    elev_value = float(elevation[row_idx, col_idx])
                    slope_value = float(slope_deg[row_idx, col_idx])
                    if not np.isfinite(elev_value) or not np.isfinite(slope_value):
                        continue

                    sampled_values.append((elev_value, slope_value))

            if not sampled_values:
                continue

            elev_values = np.array([v[0] for v in sampled_values], dtype=float)
            slope_values = np.array([v[1] for v in sampled_values], dtype=float)

            record = {
                "road_id": str(row.get("road_id", f"road_{idx}")),
                "osm_id": row.get("osm_id"),
                "name": row.get("name"),
                "highway": row.get("highway"),
                "surface": row.get("surface"),
                "sample_points": int(len(sampled_values)),
                "elevation_min": float(np.min(elev_values)),
                "elevation_max": float(np.max(elev_values)),
                "elevation_mean": float(np.mean(elev_values)),
                "elevation_std": float(np.std(elev_values)),
                "elevation_p05": float(np.percentile(elev_values, 5)),
                "elevation_p50": float(np.percentile(elev_values, 50)),
                "elevation_p95": float(np.percentile(elev_values, 95)),
                "slope_min": float(np.min(slope_values)),
                "slope_max": float(np.max(slope_values)),
                "slope_mean": float(np.mean(slope_values)),
                "slope_std": float(np.std(slope_values)),
                "slope_p50": float(np.percentile(slope_values, 50)),
                "slope_p95": float(np.percentile(slope_values, 95)),
            }
            road_rows.append(record)

    df = pd.DataFrame(road_rows)
    if df.empty:
        raise ValueError("No valid road terrain samples were generated.")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False)

    print("Terrain road features saved to:", OUTPUT_PATH)
    print("Rows:", len(df))
    print("Unique road_id:", df["road_id"].nunique())
    print("Elevation range:", float(df["elevation_min"].min()), "to", float(df["elevation_max"].max()))
    print("Slope range:", float(df["slope_min"].min()), "to", float(df["slope_max"].max()))
    print("Missing values:")
    print(df.isna().sum())


if __name__ == "__main__":
    build_terrain_features()
