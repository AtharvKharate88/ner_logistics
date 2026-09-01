import sys

sys.path.insert(0, "src")

from route_finder import get_engine

engine = get_engine()
graph = engine.artifacts.graph

print("=" * 70)
print("GRAPH INTEGRITY TEST")
print("=" * 70)

print(f"nodes = {graph.number_of_nodes():,}")
print(f"edges = {graph.number_of_edges():,}")
print(f"directed = {graph.is_directed()}")

# --------------------------------------------------
# Check nodes
# --------------------------------------------------

nodes_with_degree = sum(
    1 for n in graph.nodes
    if graph.degree(n) > 0
)

isolated_nodes = sum(
    1 for n in graph.nodes
    if graph.degree(n) == 0
)

print()
print(f"nodes_with_edges = {nodes_with_degree:,}")
print(f"isolated_nodes = {isolated_nodes:,}")

# --------------------------------------------------
# Check edges
# --------------------------------------------------

missing_geometry = 0
missing_length = 0
missing_speed = 0
invalid_length = 0
invalid_weight = 0

for u, v, data in graph.edges(data=True):

    if "geometry" not in data:
        missing_geometry += 1

    if "length_km" not in data:
        missing_length += 1
    else:
        if data["length_km"] <= 0:
            invalid_length += 1

    if "speed_kmh" not in data:
        missing_speed += 1

    if "weight" not in data:
        invalid_weight += 1

print()
print(f"missing_geometry = {missing_geometry:,}")
print(f"missing_length = {missing_length:,}")
print(f"invalid_length = {invalid_length:,}")
print(f"missing_speed = {missing_speed:,}")
print(f"missing_weight = {invalid_weight:,}")

# --------------------------------------------------
# Sample geometry
# --------------------------------------------------

sample_edge = next(iter(graph.edges(data=True)))
u, v, data = sample_edge

print()
print("Sample edge:")
print(f"  from = {u}")
print(f"  to = {v}")
print(f"  highway = {data.get('highway')}")
print(f"  length_km = {data.get('length_km')}")
print(f"  speed_kmh = {data.get('speed_kmh')}")
print(f"  geometry_type = {type(data.get('geometry')).__name__}")

# --------------------------------------------------
# Final
# --------------------------------------------------

passed = (
    isolated_nodes == 0
    and missing_geometry == 0
    and missing_length == 0
    and invalid_length == 0
    and missing_speed == 0
    and invalid_weight == 0
)

print()
print("=" * 70)

if passed:
    print("RESULT: PASS")
else:
    print("RESULT: FAIL")

print("=" * 70)