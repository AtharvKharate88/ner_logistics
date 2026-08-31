from __future__ import annotations

from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
sys.path.insert(0, str(SRC))

from graph_builder import GRAPH_PATH, NODE_INDEX_PATH, build_graph, load_graph, save_graph  # noqa: E402


class TestGraph(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not GRAPH_PATH.exists() or not NODE_INDEX_PATH.exists():
            artifacts = build_graph()
            save_graph(artifacts)
        cls.artifacts = load_graph()

    def test_graph_loads_successfully(self):
        self.assertGreater(self.artifacts.graph.number_of_nodes(), 0)
        self.assertGreater(self.artifacts.graph.number_of_edges(), 0)

    def test_edge_lengths_positive(self):
        for _, _, data in self.artifacts.graph.edges(data=True):
            self.assertGreater(data["length_km"], 0)

    def test_road_segment_ids_present(self):
        for _, _, data in self.artifacts.graph.edges(data=True):
            self.assertIn("road_segment_id", data)
            self.assertTrue(data["road_segment_id"])

    def test_nearest_node_lookup(self):
        from route_finder import RouteEngine  # noqa: E402

        engine = RouteEngine(self.artifacts)
        node = engine.nearest_node(26.1445, 91.7362)
        self.assertIn("node_id", node)
        self.assertGreaterEqual(node["distance_km"], 0)


if __name__ == "__main__":
    unittest.main()
