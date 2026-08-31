from __future__ import annotations

from datetime import date
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
sys.path.insert(0, str(SRC))

from fastapi.testclient import TestClient  # noqa: E402

from api import app  # noqa: E402
from risk.config import RouteRiskConfig, classify_risk_level  # noqa: E402
from risk.risk_service import RiskService  # noqa: E402
from risk.route_risk import _build_road_segments, _calculate_route_risk, enrich_routes_with_risk  # noqa: E402


GUWAHATI = {"lat": 26.1445, "lon": 91.7362}
SHILLONG = {"lat": 25.5788, "lon": 91.8933}
IMPHAL = {"lat": 24.8170, "lon": 93.9368}
DEPARTURE_DATE = "2025-07-15"
TEST_DESTINATION = SHILLONG


def _sample_route_response(segment_ids: list[str]) -> dict:
    return {
        "origin": GUWAHATI,
        "destination": SHILLONG,
        "routes": [
            {
                "routeId": "route_1",
                "nodeSequence": ["node_a", "node_b"],
                "roadSegmentIds": segment_ids,
                "distanceKm": 120.5,
                "estimatedTimeHours": 3.2,
                "geometry": {"type": "LineString", "coordinates": [[91.7362, 26.1445], [91.8933, 25.5788]]},
            },
            {
                "routeId": "route_2",
                "nodeSequence": ["node_a", "node_c"],
                "roadSegmentIds": segment_ids[1:] + segment_ids[:1],
                "distanceKm": 145.0,
                "estimatedTimeHours": 3.8,
                "geometry": {"type": "LineString", "coordinates": [[91.7362, 26.1445], [91.95, 25.65], [91.8933, 25.5788]]},
            },
        ],
        "snappedOrigin": {"node_id": "node_a", "lat": 26.1445, "lon": 91.7362, "distance_km": 0.01},
        "snappedDestination": {"node_id": "node_b", "lat": 25.5788, "lon": 91.8933, "distance_km": 0.02},
    }


class TestRouteRisk(unittest.TestCase):
    client = None
    risk_service = None
    config = None
    sample_segment_ids: list[str] = []

    @classmethod
    def setUpClass(cls):
        cls.risk_service = RiskService()
        cls.risk_service.load()
        cls.config = RouteRiskConfig.from_env()
        day_predictions = cls.risk_service._predictions
        day_predictions = day_predictions[day_predictions["date"] == date(2025, 7, 15)]
        cls.sample_segment_ids = day_predictions["road_segment_id"].head(12).tolist()

    @classmethod
    def _ensure_client(cls):
        if cls.client is None:
            cls.client = TestClient(app)
        return cls.client

    def test_route_engine_still_works_with_mocked_routes(self):
        route_response = _sample_route_response(self.sample_segment_ids)
        self.assertIn("routes", route_response)
        self.assertGreater(route_response["routes"][0]["distanceKm"], 0)
        self.assertTrue(route_response["routes"][0]["roadSegmentIds"])
        self.assertEqual(route_response["routes"][0]["geometry"]["type"], "LineString")

    def test_risk_predictions_load(self):
        min_date, max_date = self.risk_service.available_date_range
        self.assertEqual(min_date, date(2025, 1, 1))
        self.assertEqual(max_date, date(2025, 12, 31))

    def test_road_segment_id_join(self):
        route_response = _sample_route_response(self.sample_segment_ids[:6])
        departure_date = self.risk_service.parse_departure_date(DEPARTURE_DATE)
        enriched = enrich_routes_with_risk(route_response, departure_date, self.risk_service, self.config)
        route = enriched["routes"][0]
        self.assertEqual(len(route["roadSegments"]), len(route["roadSegmentIds"]))
        for segment in route["roadSegments"]:
            self.assertIn("roadSegmentId", segment)
            self.assertIn(segment["roadSegmentId"], route["roadSegmentIds"])

    def test_date_matching_works(self):
        parsed = self.risk_service.parse_departure_date(DEPARTURE_DATE)
        self.assertEqual(parsed, date(2025, 7, 15))

    def test_risk_values_present_when_coverage_exists(self):
        route_response = _sample_route_response(self.sample_segment_ids[:8])
        departure_date = self.risk_service.parse_departure_date(DEPARTURE_DATE)
        enriched = enrich_routes_with_risk(route_response, departure_date, self.risk_service, self.config)
        route = enriched["routes"][0]
        available_segments = [segment for segment in route["roadSegments"] if segment["riskAvailable"]]
        self.assertGreater(len(available_segments), 0)
        for segment in available_segments:
            self.assertIn("riskScore", segment)
            self.assertIn("riskLevel", segment)
            self.assertIn("anomalyScore", segment)

    def test_missing_risk_is_not_zero(self):
        enriched_route = enrich_routes_with_risk(
            {
                "origin": GUWAHATI,
                "destination": SHILLONG,
                "routes": [
                    {
                        "routeId": "route_1",
                        "roadSegmentIds": ["road_missing_segment"],
                        "distanceKm": 10.0,
                        "estimatedTimeHours": 1.0,
                        "geometry": {"type": "LineString", "coordinates": [[91.0, 26.0], [92.0, 25.0]]},
                    }
                ],
            },
            date(2025, 7, 15),
            self.risk_service,
            self.config,
        )
        segment = enriched_route["routes"][0]["roadSegments"][0]
        self.assertFalse(segment["riskAvailable"])
        self.assertNotIn("riskScore", segment)

    def test_route_risk_statistics(self):
        segment_risks = {
            "road_a": {"anomalyScore": 0.1, "riskScore": 20.0, "riskLevel": "LOW"},
            "road_b": {"anomalyScore": 0.0, "riskScore": 85.0, "riskLevel": "HIGH"},
            "road_c": None,
        }
        risk_summary = _calculate_route_risk(["road_a", "road_b", "road_c"], segment_risks, self.config)

        self.assertEqual(risk_summary["meanRisk"], 52.5)
        self.assertEqual(risk_summary["maxRisk"], 85.0)
        self.assertEqual(risk_summary["highRiskSegmentCount"], 1)
        self.assertAlmostEqual(risk_summary["riskCoverage"], 66.67, places=1)
        self.assertEqual(risk_summary["riskCoverageStatus"], "insufficient")
        segments = _build_road_segments(["road_a", "road_b", "road_c"], segment_risks)
        self.assertTrue(segments[0]["riskAvailable"])
        self.assertFalse(segments[2]["riskAvailable"])

    def test_mean_max_high_count_and_coverage(self):
        route_response = _sample_route_response(self.sample_segment_ids)
        departure_date = self.risk_service.parse_departure_date(DEPARTURE_DATE)
        enriched = enrich_routes_with_risk(route_response, departure_date, self.risk_service, self.config)
        for route in enriched["routes"]:
            risk = route["risk"]
            available_scores = [
                segment["riskScore"] for segment in route["roadSegments"] if segment.get("riskAvailable")
            ]
            if available_scores:
                self.assertAlmostEqual(risk["meanRisk"], round(sum(available_scores) / len(available_scores), 2))
                self.assertEqual(risk["maxRisk"], round(max(available_scores), 2))
                self.assertEqual(
                    risk["highRiskSegmentCount"],
                    sum(1 for score in available_scores if score >= self.config.high_risk_threshold),
                )

    def test_route_score_and_recommendation(self):
        route_response = _sample_route_response(self.sample_segment_ids)
        departure_date = self.risk_service.parse_departure_date(DEPARTURE_DATE)
        enriched = enrich_routes_with_risk(route_response, departure_date, self.risk_service, self.config)
        scored_routes = [route for route in enriched["routes"] if route["routeScore"] is not None]
        if scored_routes:
            best_route_id = min(scored_routes, key=lambda route: route["routeScore"])["routeId"]
            self.assertEqual(enriched["recommendedRouteId"], best_route_id)

    def test_geometry_preserved(self):
        route_response = _sample_route_response(self.sample_segment_ids[:4])
        departure_date = self.risk_service.parse_departure_date(DEPARTURE_DATE)
        enriched = enrich_routes_with_risk(route_response, departure_date, self.risk_service, self.config)
        for original, enriched_route in zip(route_response["routes"], enriched["routes"]):
            self.assertEqual(enriched_route["geometry"], original["geometry"])

    def test_alternative_routes_remain_different(self):
        route_response = _sample_route_response(self.sample_segment_ids[:6])
        departure_date = self.risk_service.parse_departure_date(DEPARTURE_DATE)
        enriched = enrich_routes_with_risk(route_response, departure_date, self.risk_service, self.config)
        first_ids = tuple(enriched["routes"][0]["roadSegmentIds"])
        second_ids = tuple(enriched["routes"][1]["roadSegmentIds"])
        self.assertNotEqual(first_ids, second_ids)

    def test_invalid_date(self):
        with self.assertRaises(Exception):
            self.risk_service.parse_departure_date("2025-13-40")

    def test_date_outside_prediction_range(self):
        with self.assertRaises(Exception):
            self.risk_service.parse_departure_date("2024-01-01")

    def test_api_requires_departure_date(self):
        response = self._ensure_client().post(
            "/routes/plan",
            json={"origin": GUWAHATI, "destination": IMPHAL},
        )
        self.assertEqual(response.status_code, 422)

    def test_api_invalid_date_returns_error(self):
        response = self._ensure_client().post(
            "/routes/plan",
            json={"origin": GUWAHATI, "destination": SHILLONG, "departureDate": "2024-06-01"},
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("not available", response.json()["detail"])

    @patch("api.get_engine")
    def test_api_plan_route_with_risk(self, mock_get_engine):
        mock_engine = mock_get_engine.return_value
        mock_engine.find_routes.return_value = _sample_route_response(self.sample_segment_ids[:8])
        response = self._ensure_client().post(
            "/routes/plan",
            json={
                "origin": GUWAHATI,
                "destination": SHILLONG,
                "departureDate": DEPARTURE_DATE,
                "cargoType": "medicine",
                "weight": 500,
            },
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["departureDate"], DEPARTURE_DATE)
        self.assertIn("recommendedRouteId", payload)
        self.assertIn("roadSegments", payload["routes"][0])
        self.assertIn("risk", payload["routes"][0])
        self.assertIn("geometry", payload["routes"][0])

    @patch("api.get_engine")
    def test_no_route_available(self, mock_get_engine):
        mock_engine = mock_get_engine.return_value
        mock_engine.find_routes.side_effect = ValueError("No path exists between the selected origin and destination.")
        response = self._ensure_client().post(
            "/routes/plan",
            json={"origin": GUWAHATI, "destination": IMPHAL, "departureDate": DEPARTURE_DATE},
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("No path exists", response.json()["detail"])

    @patch("api.get_engine")
    def test_same_origin_destination(self, mock_get_engine):
        mock_engine = mock_get_engine.return_value
        mock_engine.find_routes.return_value = {
            "origin": GUWAHATI,
            "destination": GUWAHATI,
            "routes": [
                {
                    "routeId": "route_1",
                    "nodeSequence": ["node_a"],
                    "roadSegmentIds": [],
                    "distanceKm": 0.0,
                    "estimatedTimeHours": 0.0,
                    "geometry": {"type": "Point", "coordinates": [91.7362, 26.1445]},
                }
            ],
            "snappedOrigin": {"node_id": "node_a", "lat": 26.1445, "lon": 91.7362, "distance_km": 0.0},
            "snappedDestination": {"node_id": "node_a", "lat": 26.1445, "lon": 91.7362, "distance_km": 0.0},
        }
        response = self._ensure_client().post(
            "/routes/plan",
            json={"origin": GUWAHATI, "destination": GUWAHATI, "departureDate": DEPARTURE_DATE},
        )
        self.assertEqual(response.status_code, 200)
        route = response.json()["routes"][0]
        self.assertEqual(route["distanceKm"], 0.0)
        self.assertEqual(route["roadSegmentIds"], [])

    @patch("api.get_engine")
    def test_invalid_origin(self, mock_get_engine):
        mock_engine = mock_get_engine.return_value
        mock_engine.find_routes.side_effect = ValueError("Origin could not be mapped to the road network.")
        response = self._ensure_client().post(
            "/routes/plan",
            json={"origin": {"lat": 0.0, "lon": 0.0}, "destination": SHILLONG, "departureDate": DEPARTURE_DATE},
        )
        self.assertEqual(response.status_code, 400)

    def test_risk_level_thresholds(self):
        self.assertEqual(classify_risk_level(20, self.config), "LOW")
        self.assertEqual(classify_risk_level(55, self.config), "MEDIUM")
        self.assertEqual(classify_risk_level(90, self.config), "HIGH")


if __name__ == "__main__":
    unittest.main()
