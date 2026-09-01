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

for origin, destination in itertools.combinations(cities, 2):
    try:
        a = cities[origin]
        b = cities[destination]

        result = engine.find_routes(
            {"lat": a[0], "lon": a[1]},
            {"lat": b[0], "lon": b[1]},
            k=1,
        )

        route = result["routes"][0]

        print(
            f"OK   {origin:10} -> {destination:10} "
            f"{route['distanceKm']:.1f} km"
        )

    except Exception as exc:
        print(
            f"FAIL {origin:10} -> {destination:10} "
            f"{type(exc).__name__}: {exc}"
        )