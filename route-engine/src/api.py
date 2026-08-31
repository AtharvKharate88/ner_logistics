from __future__ import annotations

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from route_finder import get_engine
from risk.risk_service import RiskServiceError, get_risk_service
from risk.route_risk import enrich_routes_with_risk


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
        return enrich_routes_with_risk(route_response, parsed_departure_date, risk_service)
    except (ValueError, RiskServiceError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/routes/graph/stats")
def graph_stats() -> dict[str, object]:
    engine = get_engine()
    return {
        "nodes": engine.artifacts.graph.number_of_nodes(),
        "edges": engine.artifacts.graph.number_of_edges(),
        "metadata": engine.artifacts.metadata,
    }
