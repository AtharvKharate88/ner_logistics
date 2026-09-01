from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any
import joblib
import geopandas as gpd
import networkx as nx
import numpy as np
GRAPH_DIR = Path(__file__).resolve().parents[1] / "data" / "graph"
import pandas as pd
from scipy.spatial import cKDTree
from shapely.geometry import LineString, MultiLineString, Point
from pyproj import Geod
NODE_ROUND_DECIMALS = 6
NEAREST_NODE_MAX_DISTANCE_KM = 25.0

# ============================================================
# PATHS
# ============================================================

REPO_ROOT = Path(__file__).resolve().parents[2]

ROAD_SOURCE = (
    REPO_ROOT
    / "route-engine"
    / "data"
    / "roads"
    / "processed"
    / "roads.geojson"
)

GRAPH_PATH = (
    REPO_ROOT
    / "route-engine"
    / "data"
    / "graph"
    / "road_graph.joblib"
)

NODE_INDEX_PATH = (
    REPO_ROOT
    / "route-engine"
    / "data"
    / "graph"
    / "node_index.parquet"
)


# ============================================================
# CONFIGURATION
# ============================================================

NODE_ROUND_DECIMALS = 6

# Roads useful for inter-city logistics.
MAJOR_ROAD_CLASSES = {
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
}

# Keep these out initially.
# They massively increase graph size and are not necessary
# for inter-city routing.
#
# unclassified
# residential
# service
# track
# living_street
# road

GEOD = Geod(ellps="WGS84")


# ============================================================
# DATA CLASS
# ============================================================

@dataclass(slots=True)
class GraphArtifacts:
    graph: nx.DiGraph
    node_index: pd.DataFrame
    node_tree: cKDTree
    metadata: dict[str, Any]


# ============================================================
# HELPERS
# ============================================================

def _node_id(lon: float, lat: float) -> str:
    return (
        f"node_{round(lon, NODE_ROUND_DECIMALS):.{NODE_ROUND_DECIMALS}f}_"
        f"{round(lat, NODE_ROUND_DECIMALS):.{NODE_ROUND_DECIMALS}f}"
    )


def _geometry_parts(geometry):
    if geometry is None or geometry.is_empty:
        return []

    if geometry.geom_type == "LineString":
        return [geometry]

    if geometry.geom_type == "MultiLineString":
        return [
            geom
            for geom in geometry.geoms
            if geom.geom_type == "LineString"
            and not geom.is_empty
            and len(geom.coords) >= 2
        ]

    return []


def _line_length_km(line: LineString) -> float:
    coords = list(line.coords)

    if len(coords) < 2:
        return 0.0

    total = 0.0

    for (lon1, lat1), (lon2, lat2) in zip(
        coords[:-1],
        coords[1:],
    ):
        _, _, distance_m = GEOD.inv(
            lon1,
            lat1,
            lon2,
            lat2,
        )

        total += distance_m

    return total / 1000.0


def _speed_for_highway(highway: str) -> float:
    """
    Reasonable fallback speeds for routing.

    These are routing assumptions, not measured traffic speeds.
    """

    speeds = {
        "motorway": 90.0,
        "motorway_link": 50.0,
        "trunk": 70.0,
        "trunk_link": 50.0,
        "primary": 60.0,
        "primary_link": 45.0,
        "secondary": 50.0,
        "secondary_link": 40.0,
        "tertiary": 40.0,
        "tertiary_link": 35.0,
    }

    return speeds.get(str(highway), 40.0)


# ============================================================
# LOAD ROADS
# ============================================================

def _load_roads() -> gpd.GeoDataFrame:
    print("Loading complete roads dataset...")

    roads = gpd.read_file(ROAD_SOURCE)

    print(f"Loaded {len(roads):,} road features.")

    if roads.crs is None:
        raise ValueError(
            "roads.geojson has no CRS."
        )

    roads = roads.to_crs("EPSG:4326")

    # Remove invalid/empty geometries.
    roads = roads[
        roads.geometry.notna()
        & ~roads.geometry.is_empty
        & roads.geometry.is_valid
    ].copy()

    # Keep only LineStrings/MultiLineStrings.
    roads = roads[
        roads.geom_type.isin(
            [
                "LineString",
                "MultiLineString",
            ]
        )
    ].copy()

    # Keep logistics roads.
    roads = roads[
        roads["highway"]
        .astype(str)
        .isin(MAJOR_ROAD_CLASSES)
    ].copy()

    roads.reset_index(drop=True, inplace=True)

    print(
        f"Major logistics roads retained: "
        f"{len(roads):,}"
    )

    print(
        "Highway distribution:"
    )

    print(
        roads["highway"]
        .value_counts()
        .to_string()
    )

    return roads


# ============================================================
# BUILD GRAPH
# ============================================================

def build_graph() -> GraphArtifacts:

    roads = _load_roads()

    print()
    print(
        "Building fast major-road graph..."
    )

    graph = nx.DiGraph()

    node_records: dict[str, tuple[float, float]] = {}

    edge_count = 0

    total = len(roads)

    for position, (_, row) in enumerate(
        roads.iterrows(),
        start=1,
    ):

        highway = str(
            row.get("highway", "")
        )

        osm_id = row.get(
            "osm_id",
            None,
        )

        road_segment_id = row.get(
            "road_segment_id",
            None,
        )

        # road_segment_id may not exist in source.
        if pd.isna(road_segment_id):
            road_segment_id = (
                f"road_{position}"
            )

        for line in _geometry_parts(
            row.geometry
        ):

            coords = list(line.coords)

            if len(coords) < 2:
                continue

            # ------------------------------------------------
            # IMPORTANT:
            #
            # Add every geometry coordinate as a graph node.
            #
            # This preserves the actual OSM polyline shape
            # without doing expensive global geometric noding.
            # ------------------------------------------------

            for lon, lat in coords:

                node = _node_id(
                    float(lon),
                    float(lat),
                )

                node_records[node] = (
                    float(lon),
                    float(lat),
                )

            # ------------------------------------------------
            # Create edges between consecutive coordinates.
            # ------------------------------------------------

            for p1, p2 in zip(
                coords[:-1],
                coords[1:],
            ):

                lon1, lat1 = (
                    float(p1[0]),
                    float(p1[1]),
                )

                lon2, lat2 = (
                    float(p2[0]),
                    float(p2[1]),
                )

                u = _node_id(
                    lon1,
                    lat1,
                )

                v = _node_id(
                    lon2,
                    lat2,
                )

                if u == v:
                    continue

                _, _, distance_m = GEOD.inv(
                    lon1,
                    lat1,
                    lon2,
                    lat2,
                )

                distance_km = (
                    distance_m / 1000.0
                )

                if distance_km <= 0:
                    continue

                speed_kmh = _speed_for_highway(
                    highway
                )

                travel_time_h = (
                    distance_km / speed_kmh
                )

                edge_data = {
                    "road_segment_id": str(
                        road_segment_id
                    ),
                    "osm_id": (
                        int(osm_id)
                        if pd.notna(osm_id)
                        else None
                    ),
                    "highway": highway,
                    "distance_km": distance_km,
                    "length_km": distance_km,
                    "speed_kmh": speed_kmh,
                    "travel_time_h": travel_time_h,
                    "weight": distance_km,
                    "surface": str(
                        row.get(
                            "surface",
                            ""
                        )
                    ),
                    "geometry": [
                        [lon1, lat1],
                        [lon2, lat2],
                    ],
                }

                # ------------------------------------------------
                # Oneway handling.
                # ------------------------------------------------

                oneway = str(
                    row.get(
                        "oneway",
                        ""
                    )
                ).lower()

                if oneway in {
                    "yes",
                    "true",
                    "1",
                    "-1",
                }:

                    if oneway == "-1":

                        graph.add_edge(
                            v,
                            u,
                            **edge_data,
                        )

                    else:

                        graph.add_edge(
                            u,
                            v,
                            **edge_data,
                        )

                else:

                    graph.add_edge(
                        u,
                        v,
                        **edge_data,
                    )

                    graph.add_edge(
                        v,
                        u,
                        **edge_data,
                    )

                edge_count += 1

        if position % 5000 == 0:

            print(
                f"Graph construction: "
                f"{position:,}/{total:,}"
            )

    # ========================================================
    # NODE INDEX
    # ========================================================

    print()
    print("Creating node index...")

    records = []

    for node_id, (
        lon,
        lat,
    ) in node_records.items():

        records.append(
            {
                "node_id": node_id,
                "lon": lon,
                "lat": lat,
            }
        )

    node_index = pd.DataFrame(
        records
    )

    # Web Mercator coordinates are convenient
    # for the nearest-node KD tree.

    node_gdf = gpd.GeoDataFrame(
        node_index.copy(),
        geometry=gpd.points_from_xy(
            node_index.lon,
            node_index.lat,
        ),
        crs="EPSG:4326",
    )

    node_m = node_gdf.to_crs(
        "EPSG:3857"
    )

    node_index["x_3857"] = (
        node_m.geometry.x.to_numpy()
    )

    node_index["y_3857"] = (
        node_m.geometry.y.to_numpy()
    )

    node_tree = cKDTree(
        node_index[
            [
                "x_3857",
                "y_3857",
            ]
        ].to_numpy()
    )

    metadata = {
        "road_source": str(
            ROAD_SOURCE
        ),
        "node_round_decimals":
            NODE_ROUND_DECIMALS,
        "nodes":
            graph.number_of_nodes(),
        "edges":
            graph.number_of_edges(),
        "directed": True,
        "oneway_supported": True,
        "intersection_noding": False,
        "major_road_only": True,
        "source_roads": len(roads),
    }

    print()
    print(
        "Graph built."
    )

    print(
        f"Graph nodes: "
        f"{graph.number_of_nodes():,}"
    )

    print(
        f"Graph edges: "
        f"{graph.number_of_edges():,}"
    )

    print(
        f"Source roads: "
        f"{len(roads):,}"
    )

    return GraphArtifacts(
        graph=graph,
        node_index=node_index,
        node_tree=node_tree,
        metadata=metadata,
    )


# ============================================================
# SAVE
# ============================================================

def save_graph(
    artifacts: GraphArtifacts,
) -> None:

    GRAPH_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    NODE_INDEX_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    print()
    print("Saving graph...")

    import joblib

    joblib.dump(
        artifacts.graph,
        GRAPH_PATH,
        compress=3,
    )

    artifacts.node_index.to_parquet(
        NODE_INDEX_PATH,
        index=False,
    )

    print(
        f"Graph saved to: "
        f"{GRAPH_PATH}"
    )

    print(
        f"Node index saved to: "
        f"{NODE_INDEX_PATH}"
    )
def load_graph(
    graph_path: Path | None = None,
    node_index_path: Path | None = None,
) -> GraphArtifacts:
    """Load the saved road graph and node index."""

    if graph_path is None:
        graph_path = GRAPH_PATH

    if node_index_path is None:
        node_index_path = NODE_INDEX_PATH

    if not graph_path.exists():
        raise FileNotFoundError(
            f"Graph file not found: {graph_path}"
        )

    if not node_index_path.exists():
        raise FileNotFoundError(
            f"Node index not found: {node_index_path}"
        )

    print("Loading saved graph...")

    graph = joblib.load(graph_path)
    node_index = pd.read_parquet(node_index_path)

    print(
        f"Loaded graph: "
        f"{graph.number_of_nodes():,} nodes, "
        f"{graph.number_of_edges():,} edges"
    )

    node_tree = cKDTree(
        node_index[
            ["x_3857", "y_3857"]
        ].to_numpy()
    )

    metadata = {
        "road_source": str(ROAD_SOURCE),
        "nodes": graph.number_of_nodes(),
        "edges": graph.number_of_edges(),
        "directed": graph.is_directed(),
        "major_road_only": True,
    }

    return GraphArtifacts(
        graph=graph,
        node_index=node_index,
        node_tree=node_tree,
        metadata=metadata,
    )

def nearest_node(
    artifacts: GraphArtifacts,
    lat: float,
    lon: float,
    max_distance_km: float = NEAREST_NODE_MAX_DISTANCE_KM,
    
) -> dict[str, Any]:
    """
    Find the nearest graph node to a latitude/longitude coordinate.
    """

    query = (
        gpd.GeoSeries(
            [Point(lon, lat)],
            crs="EPSG:4326",
        )
        .to_crs("EPSG:3857")
        .iloc[0]
    )

    distance, index = artifacts.node_tree.query(
        [query.x, query.y],
        k=1,
    )

    distance_km = float(distance / 1000.0)

    if not np.isfinite(distance_km) or distance_km > max_distance_km:
        raise ValueError(
            "Coordinate could not be snapped to a graph node "
            f"within {max_distance_km} km."
        )

    node_row = artifacts.node_index.iloc[int(index)]

    return {
        "node_id": str(node_row.node_id),
        "lat": float(node_row.lat),
        "lon": float(node_row.lon),
        "distance_km": distance_km,
    }    