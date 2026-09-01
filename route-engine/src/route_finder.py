from __future__ import annotations

from dataclasses import dataclass
import os
from pathlib import Path
from typing import Any

import geopandas as gpd
import networkx as nx
import numpy as np
from scipy.spatial import cKDTree
from shapely.geometry import LineString, MultiLineString, Point

from src.graph_builder import GraphArtifacts, load_graph, nearest_node


GRAPH_DIR = Path(__file__).resolve().parents[2] / "route-engine" / "data" / "graph"
DEFAULT_GRAPH_PATH = GRAPH_DIR / "road_graph.joblib"
DEFAULT_NODE_INDEX_PATH = GRAPH_DIR / "node_index.parquet"
GRAPH_PATH = Path(os.getenv("ROUTE_GRAPH_PATH", str(DEFAULT_GRAPH_PATH)))
NODE_INDEX_PATH = Path(os.getenv("ROUTE_NODE_INDEX_PATH", str(DEFAULT_NODE_INDEX_PATH)))


@dataclass(slots=True)
class RouteEngine:
    artifacts: GraphArtifacts
    _undirected: nx.Graph | None = None
    _gcc_nodes: set[str] | None = None
    _gcc_index: Any = None
    _gcc_tree: cKDTree | None = None

    @classmethod
    def load(cls) -> "RouteEngine":
        graph_path = Path(os.getenv("ROUTE_GRAPH_PATH", str(DEFAULT_GRAPH_PATH)))
        node_index_path = Path(os.getenv("ROUTE_NODE_INDEX_PATH", str(DEFAULT_NODE_INDEX_PATH)))
        return cls(load_graph(graph_path, node_index_path))

    def gcc_nodes(self) -> set[str]:
        if self._gcc_nodes is None:
            self._gcc_nodes = max(nx.weakly_connected_components(self.artifacts.graph), key=len)
            if not isinstance(self._gcc_nodes, set):
                self._gcc_nodes = set(self._gcc_nodes)
        return self._gcc_nodes

    def gcc_index(self) -> tuple[cKDTree, Any]:
        if self._gcc_tree is None:
            node_ids = self.gcc_nodes()
            index = self.artifacts.node_index.loc[
                self.artifacts.node_index["node_id"].astype(str).isin(node_ids)
            ].reset_index(drop=True)
            if index.empty:
                raise ValueError("Road graph has no connected component to snap to.")
            self._gcc_index = index
            self._gcc_tree = cKDTree(index[["x_3857", "y_3857"]].to_numpy())
        return self._gcc_tree, self._gcc_index

    def nearest_node(self, lat: float, lon: float, max_distance_km: float | None = None) -> dict[str, Any]:
        limit_km = max(
            float(max_distance_km or self.artifacts.metadata.get("snap_max_distance_km", 25.0)),
            75.0,
        )
        tree = self.artifacts.node_tree
        index = self.artifacts.node_index

        query = gpd.GeoSeries(
            [Point(lon, lat)],
            crs="EPSG:4326"
        ).to_crs("EPSG:3857")

        distance, tree_index = tree.query(
            [query.iloc[0].x, query.iloc[0].y]
        )
        distance_km = float(distance / 1000.0)
        if not np.isfinite(distance_km) or distance_km > limit_km:
            return nearest_node(self.artifacts, lat=lat, lon=lon, max_distance_km=limit_km)
        node_row = index.iloc[int(tree_index)]
        return {
            "node_id": str(node_row.node_id),
            "lat": float(node_row.lat),
            "lon": float(node_row.lon),
            "distance_km": distance_km,
        }

    def _undirected_graph(self) -> nx.Graph:
        if self._undirected is None:
            self._undirected = self.artifacts.graph.to_undirected()
        return self._undirected

    def _k_paths(self, graph: nx.Graph, origin_id: str, destination_id: str, k: int) -> list[list[str]]:
        """Dijkstra plus edge-penalty alternatives.

        Yen's algorithm (`shortest_simple_paths`) is too slow on this NER road graph
        for an interactive API. The first path is still the true shortest path.
        """
        found: list[list[str]] = []
        penalty: dict[tuple[str, str], float] = {}

        def weight(u: str, v: str, data: dict[str, Any]) -> float:
            base = float(data.get("length_km") or 1.0)
            return base * penalty.get((u, v), 1.0)

        for _ in range(max(k, 1) * 4):
            if len(found) >= k:
                break
            try:
                path = nx.dijkstra_path(graph, origin_id, destination_id, weight=weight)
            except nx.NetworkXNoPath:
                break
            if path not in found:
                found.append(path)
            for start, end in zip(path[:-1], path[1:]):
                penalty[(start, end)] = penalty.get((start, end), 1.0) * 8.0
                penalty[(end, start)] = penalty.get((end, start), 1.0) * 8.0
        return found

    def _edge_data(self, u: str, v: str) -> dict[str, Any]:
        if self.artifacts.graph.has_edge(u, v):
            return dict(self.artifacts.graph[u][v])
        if self.artifacts.graph.has_edge(v, u):
            return dict(self.artifacts.graph[v][u])
        raise ValueError(f"No graph edge between {u} and {v}.")

    def _geometry_coordinates(
        self,
        geometry: Any,
    ) -> list[list[float]]:
        # Graph stores geometry as:
        # [[lon1, lat1], [lon2, lat2]]
        if isinstance(geometry, list):
            return [
                [float(coord[0]), float(coord[1])]
                for coord in geometry
            ]

        # Support Shapely LineString
        if geometry.geom_type == "LineString":
            return [
                [float(coord[0]), float(coord[1])]
                for coord in geometry.coords
            ]

        # Support Shapely MultiLineString
        if geometry.geom_type == "MultiLineString":
            coordinates: list[list[float]] = []

            for part in geometry.geoms:
                part_coordinates = [
                    [float(coord[0]), float(coord[1])]
                    for coord in part.coords
                ]

                if (
                    coordinates
                    and coordinates[-1] == part_coordinates[0]
                ):
                    coordinates.extend(part_coordinates[1:])
                else:
                    coordinates.extend(part_coordinates)

            return coordinates

        return []

    def _build_route_geometry(self, node_sequence: list[str]) -> dict[str, Any]:
        coordinates: list[list[float]] = []
        for start, end in zip(node_sequence[:-1], node_sequence[1:]):
            edge = self._edge_data(start, end)
            edge_coords = self._geometry_coordinates(edge["geometry"])
            if coordinates and edge_coords and coordinates[-1] == edge_coords[0]:
                coordinates.extend(edge_coords[1:])
            else:
                coordinates.extend(edge_coords)
        if not coordinates and node_sequence:
            node = self.artifacts.node_index.loc[self.artifacts.node_index.node_id == node_sequence[0]].iloc[0]
            coordinates = [[float(node.lon), float(node.lat)]]
        return {"type": "LineString", "coordinates": coordinates}

    def _route_from_nodes(self, node_sequence: list[str], route_id: str) -> dict[str, Any]:
        if len(node_sequence) == 1:
            node = self.artifacts.node_index.loc[self.artifacts.node_index.node_id == node_sequence[0]].iloc[0]
            return {
                "routeId": route_id,
                "nodeSequence": node_sequence,
                "roadSegmentIds": [],
                "distanceKm": 0.0,
                "estimatedTimeHours": 0.0,
                "geometry": {"type": "Point", "coordinates": [float(node.lon), float(node.lat)]},
            }

        road_segment_ids: list[str] = []
        distance_km = 0.0
        estimated_time_hours = 0.0
        for start, end in zip(node_sequence[:-1], node_sequence[1:]):
            edge = self._edge_data(start, end)
            road_segment_id = str(edge["road_segment_id"])
            if not road_segment_ids or road_segment_ids[-1] != road_segment_id:
                road_segment_ids.append(road_segment_id)
            distance_km += float(edge["length_km"])
            estimated_time_hours += float(
                edge.get(
                    "travel_time_hours",
                    edge.get("travel_time_h", 0.0)
                )
            )
        return {
            "routeId": route_id,
            "nodeSequence": node_sequence,
            "roadSegmentIds": road_segment_ids,
            "distanceKm": float(distance_km),
            "estimatedTimeHours": float(estimated_time_hours),
            "geometry": self._build_route_geometry(node_sequence),
        }

    def find_routes(self, origin: dict[str, float], destination: dict[str, float], k: int = 3) -> dict[str, Any]:
        origin_node = self.nearest_node(origin["lat"], origin["lon"])
        destination_node = self.nearest_node(destination["lat"], destination["lon"])
        origin_id = origin_node["node_id"]
        destination_id = destination_node["node_id"]

        if origin_id == destination_id:
            route = self._route_from_nodes([origin_id], "route_1")
            return {
                "origin": origin,
                "destination": destination,
                "routes": [route],
                "snappedOrigin": origin_node,
                "snappedDestination": destination_node,
            }

        try:
            paths = self._k_paths(self.artifacts.graph, origin_id, destination_id, k)
            if not paths:
                undirected = self._undirected_graph()
                paths = self._k_paths(undirected, origin_id, destination_id, k)
        except nx.NodeNotFound as exc:
            raise ValueError("Origin or destination could not be mapped to the road network.") from exc

        if not paths:
            raise ValueError("No path exists between the selected origin and destination.")

        routes = [self._route_from_nodes(path, f"route_{index + 1}") for index, path in enumerate(paths)]
        return {
            "origin": origin,
            "destination": destination,
            "routes": routes,
            "snappedOrigin": origin_node,
            "snappedDestination": destination_node,
        }


_ENGINE: RouteEngine | None = None


def get_engine() -> RouteEngine:
    global _ENGINE
    if _ENGINE is None:
        _ENGINE = RouteEngine.load()
    return _ENGINE
