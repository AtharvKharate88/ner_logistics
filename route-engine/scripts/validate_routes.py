from __future__ import annotations

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
sys.path.insert(0, str(SRC))

from graph_builder import build_graph, save_graph  # noqa: E402
from route_finder import get_engine  # noqa: E402

REPORT = ROOT / "reports" / "route_validation_report.txt"
TEST_ROUTES = [
    ("Guwahati", {"lat": 26.1445, "lon": 91.7362}, "Shillong", {"lat": 25.5788, "lon": 91.8933}),
    ("Guwahati", {"lat": 26.1445, "lon": 91.7362}, "Imphal", {"lat": 24.8170, "lon": 93.9368}),
    ("Imphal", {"lat": 24.8170, "lon": 93.9368}, "Kohima", {"lat": 25.6751, "lon": 94.1086}),
    ("Guwahati", {"lat": 26.1445, "lon": 91.7362}, "Itanagar", {"lat": 27.0844, "lon": 93.6053}),
    ("Shillong", {"lat": 25.5788, "lon": 91.8933}, "Aizawl", {"lat": 23.7271, "lon": 92.7176}),
]


def main() -> None:
    if not (ROOT / "data" / "graph" / "road_graph.joblib").exists():
        artifacts = build_graph()
        save_graph(artifacts)
    engine = get_engine()
    lines: list[str] = ["Route validation report"]
    for index, (origin_name, origin, destination_name, destination) in enumerate(TEST_ROUTES, start=1):
        result = engine.find_routes(origin, destination, k=3)
        routes = result["routes"]
        first = routes[0]
        origin_snap = result["snappedOrigin"]
        destination_snap = result["snappedDestination"]
        route_ok = first["distanceKm"] > 0 or origin_name == destination_name
        consecutive_connect = True
        for route in routes:
            nodes = route["nodeSequence"]
            for start, end in zip(nodes[:-1], nodes[1:]):
                if not engine.artifacts.graph.has_edge(start, end):
                    consecutive_connect = False
                    break
        unique_routes = len({tuple(route["roadSegmentIds"]) for route in routes}) == len(routes)
        lines.extend([
            f"test_{index}={origin_name}->{destination_name}",
            f"  origin_snap_distance_km={origin_snap['distance_km']:.6f}",
            f"  destination_snap_distance_km={destination_snap['distance_km']:.6f}",
            f"  routes={len(routes)}",
            f"  first_route_distance_km={first['distanceKm']:.6f}",
            f"  first_route_time_hours={first['estimatedTimeHours']:.6f}",
            f"  first_route_segment_count={len(first['roadSegmentIds'])}",
            f"  first_route_geometry_type={first['geometry']['type']}",
            f"  consecutive_edges_connect={consecutive_connect}",
            f"  alternative_routes_unique={unique_routes}",
            f"  distance_positive={first['distanceKm'] >= 0}",
        ])
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Validation report written to {REPORT}")


if __name__ == "__main__":
    main()
