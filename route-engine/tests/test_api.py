from __future__ import annotations

import os
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
sys.path.insert(0, str(SRC))

from fastapi.testclient import TestClient  # noqa: E402

from graph_builder import GRAPH_PATH, NODE_INDEX_PATH, build_graph, save_graph  # noqa: E402
from api import app  # noqa: E402


class TestApi(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not GRAPH_PATH.exists() or not NODE_INDEX_PATH.exists():
            artifacts = build_graph()
            save_graph(artifacts)
        cls.client = TestClient(app)

    def test_health_endpoint(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["status"], "ok")

    def test_plan_route_endpoint(self):
        response = self.client.post(
            "/routes/plan",
            json={
                "origin": {"lat": 26.1445, "lon": 91.7362},
                "destination": {"lat": 25.5788, "lon": 91.8933},
                "departureDate": "2025-07-15",
                "cargoType": "medicine",
                "weight": 500,
            },
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("routes", payload)
        self.assertGreaterEqual(len(payload["routes"]), 1)
        self.assertIn("roadSegmentIds", payload["routes"][0])
        self.assertIn("roadSegments", payload["routes"][0])
        self.assertIn("risk", payload["routes"][0])

    def test_invalid_coordinates_return_error(self):
        response = self.client.post(
            "/routes/plan",
            json={
                "origin": {"lat": 0.0, "lon": 0.0},
                "destination": {"lat": 25.5788, "lon": 91.8933},
                "departureDate": "2025-07-15",
            },
        )
        self.assertIn(response.status_code, {400, 422})


if __name__ == "__main__":
    unittest.main()
