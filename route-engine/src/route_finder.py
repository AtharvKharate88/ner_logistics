from __future__ import annotations

from dataclasses import dataclass
from itertools import islice
import os
from pathlib import Path
from typing import Any

import networkx as nx
import numpy as np
from shapely.geometry import LineString, MultiLineString

from graph_builder import GraphArtifacts, load_graph, nearest_node


GRAPH_DIR = Path(__file__).resolve().parents[2] / "route-engine" / "data" / "graph"
DEFAULT_GRAPH_PATH = GRAPH_DIR / "road_graph.joblib"
DEFAULT_NODE_INDEX_PATH = GRAPH_DIR / "node_index.parquet"
GRAPH_PATH = Path(os.getenv("ROUTE_GRAPH_PATH", str(DEFAULT_GRAPH_PATH)))
NODE_INDEX_PATH = Path(os.getenv("ROUTE_NODE_INDEX_PATH", str(DEFAULT_NODE_INDEX_PATH)))


@dataclass(slots=True)
class RouteEngine:
    artifacts: GraphArtifacts

    @classmethod
    def load(cls) -> "RouteEngine":
        graph_path = Path(os.getenv("ROUTE_GRAPH_PATH", str(DEFAULT_GRAPH_PATH)))
        node_index_path = Path(os.getenv("ROUTE_NODE_INDEX_PATH", str(DEFAULT_NODE_INDEX_PATH)))
        return cls(load_graph(graph_path, node_index_path))

    def nearest_node(self, lat: float, lon: float, max_distance_km: float | None = None) -> dict[str, Any]:
        return nearest_node(self.artifacts, lat=lat, lon=lon, max_distance_km=max_distance_km or self.artifacts.metadata.get("snap_max_distance_km", 25.0))

    def _edge_data(self, u: str, v: str) -> dict[str, Any]:
        return dict(self.artifacts.graph[u][v])

    def _geometry_coordinates(self, geometry: LineString | MultiLineString) -> list[list[float]]:
        if geometry.geom_type == "LineString":
            return [list(coord) for coord in geometry.coords]
        if geometry.geom_type == "MultiLineString":
            coordinates: list[list[float]] = []
            for part in geometry.geoms:
                part_coordinates = [list(coord) for coord in part.coords]
                if coordinates and coordinates[-1] == part_coordinates[0]:
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
            estimated_time_hours += float(edge["travel_time_hours"])
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

        paths = []
        try:
            path_iter = nx.shortest_simple_paths(self.artifacts.graph, origin_id, destination_id, weight="length_km")
            paths = list(islice(path_iter, k))
        except nx.NetworkXNoPath as exc:
            raise ValueError("No path exists between the selected origin and destination.") from exc
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
