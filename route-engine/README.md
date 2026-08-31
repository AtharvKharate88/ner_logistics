## Route Engine Structure

This module is organized by responsibility:

- `src/graph_builder.py` for road graph construction and serialization
- `src/route_finder.py` for shortest and alternative route search
- `src/speed_config.py` for prototype speed assumptions
- `src/api.py` for the standalone Python route service
- `data/roads/raw/` for source road extracts
- `data/roads/processed/` for cleaned road GeoJSON used by downstream modules
- `data/graph/` for the saved NetworkX graph and node index
- `scripts/build_graph.py` to generate the reusable graph artifact
- `scripts/validate_routes.py` to run route checks and write a report
- `tests/` for graph, route, and API tests

Prototype limitations:

- no live traffic
- no live road closures
- no real-time weather in route calculation yet
- maxspeed is missing for many OSM roads
- routing uses prototype speed assumptions when maxspeed is unavailable
- the risk model is not connected yet


