from __future__ import annotations

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from src.route_finder import get_engine
from src.risk.risk_service import RiskServiceError, get_risk_service
from src.risk.route_risk import enrich_routes_with_risk

import networkx as nx

app = FastAPI(title="NER Route Engine", version="2.0.0")


class Coordinate(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)


class RoutePlanRequest(BaseModel):
    origin: Coordinate
    destination: Coordinate
    departureDate: str = Field(..., min_length=10, max_length=10)
    cargoType: str | None = None
    weight: float | None = None


@app.on_event("startup")
def startup_event() -> None:
    get_risk_service()
    # Graph load is slow; do it at startup so the first HTTP request is not killed by Node timeouts.
    engine = get_engine()
    engine.gcc_index()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ner-route-engine"}


@app.post("/routes/plan")
def plan_route(request: RoutePlanRequest):
    risk_service = get_risk_service()
    try:
        parsed_departure_date = risk_service.parse_departure_date(request.departureDate)
        engine = get_engine()
        route_response = engine.find_routes(
            request.origin.model_dump(),
            request.destination.model_dump(),
            k=3,
        )
        enriched = enrich_routes_with_risk(route_response, parsed_departure_date, risk_service)
        enriched["requestedDepartureDate"] = request.departureDate
        enriched["riskLookupDate"] = parsed_departure_date.isoformat()
        return enriched
    except (ValueError, RiskServiceError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/risk/segment/{segment_id}")
def segment_risk(segment_id: str, date: str):
    risk_service = get_risk_service()
    try:
        parsed_date = risk_service.parse_departure_date(date)
        lookup = risk_service.lookup_segments([segment_id], parsed_date)
        risk = lookup.get(segment_id)
        if risk is None:
            return {
                "success": True,
                "roadSegmentId": segment_id,
                "date": parsed_date.isoformat(),
                "riskAvailable": False,
            }
        return {
            "success": True,
            "roadSegmentId": segment_id,
            "date": parsed_date.isoformat(),
            "riskAvailable": True,
            **risk,
        }
    except RiskServiceError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/routes/graph/stats")
def graph_stats() -> dict[str, object]:
    engine = get_engine()
    return {
        "nodes": engine.artifacts.graph.number_of_nodes(),
        "edges": engine.artifacts.graph.number_of_edges(),
        "metadata": engine.artifacts.metadata,
    }

@app.get("/debug/route-test")
def debug_route_test():
    engine = get_engine()

    guwahati = engine.nearest_node(26.1445, 91.7362)
    imphal = engine.nearest_node(24.8170, 93.9368)
    shillong = engine.nearest_node(25.5788, 91.8933)

    gcc = engine.gcc_nodes()

    return {
        "gcc_size": len(gcc),
        "graph_nodes": engine.artifacts.graph.number_of_nodes(),

        "guwahati": {
            **guwahati,
            "in_graph": guwahati["node_id"] in engine.artifacts.graph,
            "in_gcc": guwahati["node_id"] in gcc,
        },

        "imphal": {
            **imphal,
            "in_graph": imphal["node_id"] in engine.artifacts.graph,
            "in_gcc": imphal["node_id"] in gcc,
        },

        "shillong": {
            **shillong,
            "in_graph": shillong["node_id"] in engine.artifacts.graph,
            "in_gcc": shillong["node_id"] in gcc,
        },
    }
@app.get("/debug/connectivity")
def debug_connectivity():
    engine = get_engine()
    graph = engine.artifacts.graph

    guwahati = engine.nearest_node(26.1445, 91.7362)
    shillong = engine.nearest_node(25.5788, 91.8933)
    imphal = engine.nearest_node(24.8170, 93.9368)

    def component_size(node_id: str) -> int:
        component = nx.node_connected_component(
            graph.to_undirected(),
            node_id
        )
        return len(component)

    return {
        "graph_nodes": graph.number_of_nodes(),
        "graph_edges": graph.number_of_edges(),
        "gcc_size": len(engine.gcc_nodes()),

        "guwahati": {
            **guwahati,
            "component_size": component_size(guwahati["node_id"]),
        },

        "shillong": {
            **shillong,
            "component_size": component_size(shillong["node_id"]),
        },

        "imphal": {
            **imphal,
            "component_size": component_size(imphal["node_id"]),
        },
    }