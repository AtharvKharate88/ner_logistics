from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any

import geopandas as gpd
import joblib
import networkx as nx
import numpy as np
import pandas as pd
from pyproj import Geod
from scipy.spatial import cKDTree
from shapely.geometry import LineString, MultiLineString, Point

from speed_config import parse_speed_value, resolve_edge_speed_kmh


REPO_ROOT = Path(__file__).resolve().parents[2]
ROAD_SOURCE = REPO_ROOT / "ml" / "data" / "processed" / "road_segments.geojson"
GRAPH_DIR = REPO_ROOT / "route-engine" / "data" / "graph"
GRAPH_PATH = GRAPH_DIR / "road_graph.joblib"
NODE_INDEX_PATH = GRAPH_DIR / "node_index.parquet"
REPORT_PATH = REPO_ROOT / "route-engine" / "reports" / "road_graph_input_validation.txt"
NODE_ROUND_DECIMALS = 6
NEAREST_NODE_MAX_DISTANCE_KM = 25.0

GEOD = Geod(ellps="WGS84")


@dataclass(slots=True)
class GraphArtifacts:
    graph: nx.DiGraph
    node_index: pd.DataFrame
    node_tree: cKDTree
    metadata: dict[str, Any]


def _round_value(value: float) -> float:
    return round(float(value), NODE_ROUND_DECIMALS)


def _node_id_from_xy(x: float, y: float) -> str:
    return f"node_{_round_value(x):.{NODE_ROUND_DECIMALS}f}_{_round_value(y):.{NODE_ROUND_DECIMALS}f}"


def _geometry_parts(geometry: LineString | MultiLineString) -> list[LineString]:
    if geometry.geom_type == "LineString":
        return [geometry]
    if geometry.geom_type == "MultiLineString":
        return list(geometry.geoms)
    return []


def _segment_pairs(geometry: LineString | MultiLineString):
    for part in _geometry_parts(geometry):
        coords = list(part.coords)
        if len(coords) < 2:
            continue
        for start, end in zip(coords[:-1], coords[1:]):
            if start != end:
                yield start, end


def _geodesic_length_km(geometry: LineString | MultiLineString) -> float:
    total_metres = 0.0
    for part in _geometry_parts(geometry):
        coords = list(part.coords)
        if len(coords) < 2:
            continue
        lons = [coord[0] for coord in coords]
        lats = [coord[1] for coord in coords]
        total_metres += GEOD.line_length(lons, lats)
    return float(total_metres / 1000.0)


def _reverse_geometry(geometry: LineString | MultiLineString) -> LineString | MultiLineString:
    if geometry.geom_type == "LineString":
        return LineString(list(geometry.coords)[::-1])
    if geometry.geom_type == "MultiLineString":
        reversed_parts = [LineString(list(part.coords)[::-1]) for part in list(geometry.geoms)[::-1]]
        return MultiLineString(reversed_parts)
    return geometry


def _is_one_way(raw_value: Any) -> bool:
    if raw_value is None:
        return False
    text = str(raw_value).strip().lower()
    return text in {"yes", "true", "1", "forward", "oneway", "t", "y"}


def _is_reverse_one_way(raw_value: Any) -> bool:
    if raw_value is None:
        return False
    text = str(raw_value).strip().lower()
    return text in {"-1", "reverse"}


def load_road_data(path: Path | None = None) -> gpd.GeoDataFrame:
    road_path = path or ROAD_SOURCE
    roads = gpd.read_file(road_path, engine="pyogrio")
    if roads.crs is None:
        raise ValueError("Road GeoDataFrame has no CRS; EPSG:4326 is required.")
    roads = roads.to_crs("EPSG:4326")
    if "road_segment_id" not in roads.columns:
        roads = roads.reset_index(drop=True)
        roads["road_segment_id"] = [f"road_{index}" for index in roads.index]
    return roads


def validate_road_data(roads: gpd.GeoDataFrame) -> dict[str, Any]:
    geometry_types = roads.geometry.geom_type.value_counts().to_dict()
    highway_distribution = roads["highway"].value_counts(dropna=False).to_dict() if "highway" in roads.columns else {}
    report = {
        "path": str(ROAD_SOURCE),
        "crs": str(roads.crs),
        "rows": int(len(roads)),
        "columns": list(roads.columns),
        "geometry_types": geometry_types,
        "valid_geometries": int(roads.geometry.is_valid.sum()),
        "invalid_geometries": int((~roads.geometry.is_valid).sum()),
        "empty_geometries": int(roads.geometry.is_empty.sum()),
        "road_segment_id_unique": int(roads["road_segment_id"].nunique()) if "road_segment_id" in roads.columns else 0,
        "highway_distribution": highway_distribution,
        "bounds": [float(v) for v in roads.total_bounds.tolist()],
        "oneway_distribution": roads["oneway"].value_counts(dropna=False).to_dict() if "oneway" in roads.columns else {},
    }
    return report


def write_validation_report(report: dict[str, Any], report_path: Path = REPORT_PATH) -> None:
    report_path.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "Road graph input validation",
        f"path={report['path']}",
        f"crs={report['crs']}",
        f"rows={report['rows']}",
        f"columns={report['columns']}",
        f"geometry_types={report['geometry_types']}",
        f"valid_geometries={report['valid_geometries']}",
        f"invalid_geometries={report['invalid_geometries']}",
        f"empty_geometries={report['empty_geometries']}",
        f"road_segment_id_unique={report['road_segment_id_unique']}",
        f"highway_distribution={report['highway_distribution']}",
        f"bounds={report['bounds']}",
        f"oneway_distribution={report['oneway_distribution']}",
        "status=PASS" if report['invalid_geometries'] == 0 and report['empty_geometries'] == 0 else "status=CHECK",
    ]
    report_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def build_graph(road_path: Path | None = None) -> GraphArtifacts:
    roads = load_road_data(road_path)
    report = validate_road_data(roads)
    write_validation_report(report)

    graph = nx.DiGraph()
    node_records: dict[str, dict[str, float]] = {}

    for row in roads.itertuples(index=False):
        geometry = row.geometry
        if geometry is None or geometry.is_empty:
            continue
        if geometry.geom_type not in {"LineString", "MultiLineString"}:
            continue

        pairs = list(_segment_pairs(geometry))
        if not pairs:
            continue

        highway = getattr(row, "highway", None)
        maxspeed = getattr(row, "maxspeed", None)
        oneway = getattr(row, "oneway", None)
        speed_kmh = resolve_edge_speed_kmh(highway, maxspeed)
        for start_coords, end_coords in pairs:
            start_node = _node_id_from_xy(start_coords[0], start_coords[1])
            end_node = _node_id_from_xy(end_coords[0], end_coords[1])
            sub_geometry = LineString([start_coords, end_coords])
            length_km = _geodesic_length_km(sub_geometry)
            if not np.isfinite(length_km) or length_km <= 0:
                continue
            travel_time_hours = float(length_km / speed_kmh) if speed_kmh > 0 else float("inf")

            node_records.setdefault(start_node, {"node_id": start_node, "lon": _round_value(start_coords[0]), "lat": _round_value(start_coords[1])})
            node_records.setdefault(end_node, {"node_id": end_node, "lon": _round_value(end_coords[0]), "lat": _round_value(end_coords[1])})

            edge_payload = {
                "road_segment_id": str(getattr(row, "road_segment_id")),
                "osm_id": str(getattr(row, "osm_id", "")),
                "highway": highway,
                "surface": getattr(row, "surface", None),
                "oneway": oneway,
                "maxspeed": parse_speed_value(maxspeed),
                "length_km": float(length_km),
                "speed_kmh": float(speed_kmh),
                "travel_time_hours": float(travel_time_hours),
                "geometry": sub_geometry,
            }

            def add_edge(u: str, v: str, payload: dict[str, Any]) -> None:
                if graph.has_edge(u, v):
                    existing = graph[u][v]
                    if payload["length_km"] < existing["length_km"]:
                        graph[u][v].update(payload)
                    return
                graph.add_edge(u, v, **payload)

            if _is_reverse_one_way(oneway):
                add_edge(end_node, start_node, {**edge_payload, "geometry": _reverse_geometry(sub_geometry)})
            elif _is_one_way(oneway):
                add_edge(start_node, end_node, edge_payload)
            else:
                add_edge(start_node, end_node, edge_payload)
                add_edge(end_node, start_node, {**edge_payload, "geometry": _reverse_geometry(sub_geometry)})

    node_index = pd.DataFrame(node_records.values()).sort_values("node_id").reset_index(drop=True)
    if node_index.empty:
        raise ValueError("No graph nodes were created from the road dataset.")
    projected = gpd.GeoDataFrame(
        node_index,
        geometry=gpd.points_from_xy(node_index["lon"], node_index["lat"]),
        crs="EPSG:4326",
    ).to_crs("EPSG:3857")
    node_index["x_3857"] = projected.geometry.x.astype(float)
    node_index["y_3857"] = projected.geometry.y.astype(float)
    node_tree = cKDTree(node_index[["x_3857", "y_3857"]].to_numpy())

    metadata = {
        "road_source": str(road_path or ROAD_SOURCE),
        "node_round_decimals": NODE_ROUND_DECIMALS,
        "nodes": int(len(node_index)),
        "edges": int(graph.number_of_edges()),
        "directed": True,
        "oneway_supported": True,
        "snap_max_distance_km": NEAREST_NODE_MAX_DISTANCE_KM,
    }

    return GraphArtifacts(graph=graph, node_index=node_index, node_tree=node_tree, metadata=metadata)


def save_graph(artifacts: GraphArtifacts, graph_path: Path = GRAPH_PATH, node_index_path: Path = NODE_INDEX_PATH) -> None:
    graph_path.parent.mkdir(parents=True, exist_ok=True)
    node_index_path.parent.mkdir(parents=True, exist_ok=True)

    graph_tmp_path: str | None = None
    node_tmp_path: str | None = None
    try:
        with NamedTemporaryFile("wb", dir=graph_path.parent, prefix=f".{graph_path.name}.", suffix=".tmp", delete=False) as graph_tmp:
            graph_tmp_path = graph_tmp.name
            joblib.dump({"graph": artifacts.graph, "metadata": artifacts.metadata}, graph_tmp.name)
            graph_tmp.flush()
            os.fsync(graph_tmp.fileno())
        os.replace(graph_tmp_path, graph_path)

        with NamedTemporaryFile("wb", dir=node_index_path.parent, prefix=f".{node_index_path.name}.", suffix=".tmp", delete=False) as node_tmp:
            node_tmp_path = node_tmp.name
            artifacts.node_index.to_parquet(node_tmp.name, index=False)
            node_tmp.flush()
            os.fsync(node_tmp.fileno())
        os.replace(node_tmp_path, node_index_path)
    except Exception:
        for tmp_path in (graph_tmp_path, node_tmp_path):
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)
        raise


def load_graph(graph_path: Path = GRAPH_PATH, node_index_path: Path = NODE_INDEX_PATH) -> GraphArtifacts:
    payload = joblib.load(graph_path)
    node_index = pd.read_parquet(node_index_path)
    node_tree = cKDTree(node_index[["x_3857", "y_3857"]].to_numpy())
    return GraphArtifacts(graph=payload["graph"], node_index=node_index, node_tree=node_tree, metadata=payload.get("metadata", {}))


def nearest_node(artifacts: GraphArtifacts, lat: float, lon: float, max_distance_km: float = NEAREST_NODE_MAX_DISTANCE_KM) -> dict[str, Any]:
    query = gpd.GeoSeries([Point(lon, lat)], crs="EPSG:4326").to_crs("EPSG:3857")
    distance, index = artifacts.node_tree.query([query.iloc[0].x, query.iloc[0].y])
    node_row = artifacts.node_index.iloc[int(index)]
    distance_km = float(distance / 1000.0)
    if not np.isfinite(distance_km):
        raise ValueError("No valid nearest graph node exists for the provided coordinate.")
    if distance_km > max_distance_km:
        raise ValueError(f"Coordinate is outside the supported road network (nearest node is {distance_km:.2f} km away).")
    return {
        "node_id": str(node_row.node_id),
        "lat": float(node_row.lat),
        "lon": float(node_row.lon),
        "distance_km": distance_km,
    }
