import sys
import itertools

sys.path.insert(0, "src")

from route_finder import get_engine


engine = get_engine()

cities = {
    "Guwahati": (26.1445, 91.7362),
    "Shillong": (25.5788, 91.8933),
    "Imphal": (24.8170, 93.9368),
    "Kohima": (25.6751, 94.1086),
    "Itanagar": (27.0844, 93.6053),
    "Aizawl": (23.7271, 92.7176),
}


print("=" * 70)
print("ROUTE QUALITY TEST")
print("=" * 70)


for origin, destination in itertools.combinations(cities, 2):

    a = cities[origin]
    b = cities[destination]

    print(f"\n{origin} -> {destination}")

    try:
        result = engine.find_routes(
            {"lat": a[0], "lon": a[1]},
            {"lat": b[0], "lon": b[1]},
            k=3,
        )

        routes = result["routes"]

        print(
            f"  snapped origin: "
            f"{result['snappedOrigin']['distance_km']:.3f} km"
        )

        print(
            f"  snapped destination: "
            f"{result['snappedDestination']['distance_km']:.3f} km"
        )

        print(f"  routes returned: {len(routes)}")

        distances = []

        for i, route in enumerate(routes, 1):

            distance = route["distanceKm"]
            time = route["estimatedTimeHours"]
            segments = len(route["roadSegmentIds"])
            geometry = route["geometry"]

            distances.append(distance)

            print(
                f"  Route {i}: "
                f"{distance:.1f} km | "
                f"{time:.2f} h | "
                f"{segments} segments | "
                f"{geometry['type']}"
            )

        # --------------------------------------------------
        # Quality checks
        # --------------------------------------------------

        checks = []

        # At least one route
        checks.append(
            ("has_route", len(routes) > 0)
        )

        # Distances must be positive
        checks.append(
            (
                "positive_distance",
                all(d > 0 for d in distances),
            )
        )

        # Geometry must be LineString
        checks.append(
            (
                "linestring_geometry",
                all(
                    r["geometry"]["type"] == "LineString"
                    for r in routes
                ),
            )
        )

        # Alternative routes should differ in distance
        checks.append(
            (
                "alternative_distances_differ",
                len(set(round(d, 3) for d in distances))
                == len(distances),
            )
        )

        # Route 1 should normally be shortest
        checks.append(
            (
                "route1_shortest",
                distances[0] <= min(distances) + 1e-6,
            )
        )

        for name, passed in checks:
            print(
                f"    {'PASS' if passed else 'FAIL'} "
                f"{name}"
            )

    except Exception as exc:

        print(
            f"  FAIL: "
            f"{type(exc).__name__}: {exc}"
        )


print("\n" + "=" * 70)
print("ROUTE QUALITY TEST COMPLETE")
print("=" * 70)