from __future__ import annotations

from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
sys.path.insert(0, str(SRC))

import networkx as nx  # noqa: E402

from graph_builder import GRAPH_PATH, NODE_INDEX_PATH, GraphArtifacts, build_graph, load_graph, save_graph  # noqa: E402
from route_finder import RouteEngine  # noqa: E402


class TestRouteFinder(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not GRAPH_PATH.exists() or not NODE_INDEX_PATH.exists():
            artifacts = build_graph()
            save_graph(artifacts)
        cls.engine = RouteEngine(load_graph())

    def test_shortest_route_exists(self):
        result = self.engine.find_routes({"lat": 26.1445, "lon": 91.7362}, {"lat": 25.5788, "lon": 91.8933}, k=3)
        self.assertIn("routes", result)
        self.assertGreaterEqual(len(result["routes"]), 1)
        route = result["routes"][0]
        self.assertGreater(route["distanceKm"], 0)
        self.assertGreater(len(route["roadSegmentIds"]), 0)
        self.assertEqual(route["geometry"]["type"], "LineString")

    def test_alternative_routes_are_different(self):
        result = self.engine.find_routes({"lat": 26.1445, "lon": 91.7362}, {"lat": 24.8170, "lon": 93.9368}, k=3)
        routes = result["routes"]
        self.assertGreaterEqual(len(routes), 1)
        road_sequences = {tuple(route["roadSegmentIds"]) for route in routes}
        self.assertEqual(len(road_sequences), len(routes))

    def test_origin_equals_destination(self):
        result = self.engine.find_routes({"lat": 26.1445, "lon": 91.7362}, {"lat": 26.1445, "lon": 91.7362}, k=3)
        self.assertEqual(len(result["routes"]), 1)
        self.assertEqual(result["routes"][0]["distanceKm"], 0)
        self.assertEqual(result["routes"][0]["roadSegmentIds"], [])

    def test_invalid_coordinates_return_error(self):
        with self.assertRaises(ValueError):
            self.engine.find_routes({"lat": 0.0, "lon": 0.0}, {"lat": 26.1445, "lon": 91.7362}, k=3)

    def test_unreachable_locations_return_error(self):
        artifacts = self.engine.artifacts
        isolated_graph = artifacts.graph.copy()
        isolated_graph.remove_edges_from(list(isolated_graph.edges()))
        isolated_artifacts = GraphArtifacts(
            graph=isolated_graph,
            node_index=artifacts.node_index,
            node_tree=artifacts.node_tree,
            metadata=artifacts.metadata,
        )
        isolated_engine = RouteEngine(isolated_artifacts)
        with self.assertRaises(ValueError):
            isolated_engine.find_routes({"lat": 26.1445, "lon": 91.7362}, {"lat": 25.5788, "lon": 91.8933}, k=3)


if __name__ == "__main__":
    unittest.main()
