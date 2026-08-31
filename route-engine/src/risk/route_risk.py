from __future__ import annotations

from datetime import date
from typing import Any

from risk.config import RouteRiskConfig, classify_risk_level
from risk.risk_service import RiskService


def _normalize(values: list[float]) -> list[float]:
    if not values:
        return []
    minimum = min(values)
    maximum = max(values)
    if maximum == minimum:
        return [0.0 for _ in values]
    return [(value - minimum) / (maximum - minimum) for value in values]


def _build_road_segments(
    segment_ids: list[str],
    segment_risks: dict[str, dict[str, Any] | None],
) -> list[dict[str, Any]]:
    road_segments: list[dict[str, Any]] = []
    for segment_id in segment_ids:
        risk = segment_risks.get(segment_id)
        if risk is None:
            road_segments.append(
                {
                    "roadSegmentId": segment_id,
                    "riskAvailable": False,
                }
            )
            continue

        road_segments.append(
            {
                "roadSegmentId": segment_id,
                "riskAvailable": True,
                "anomalyScore": risk["anomalyScore"],
                "riskScore": risk["riskScore"],
                "riskLevel": risk["riskLevel"],
            }
        )
    return road_segments


def _calculate_route_risk(
    segment_ids: list[str],
    segment_risks: dict[str, dict[str, Any] | None],
    config: RouteRiskConfig,
) -> dict[str, Any]:
    if not segment_ids:
        return {
            "meanRisk": None,
            "maxRisk": None,
            "highRiskSegmentCount": 0,
            "riskCoverage": 100.0,
            "riskCoverageStatus": "complete",
            "riskLevel": "LOW",
            "segmentsWithRisk": 0,
            "segmentsWithoutRisk": 0,
        }

    available_scores: list[float] = []
    high_risk_count = 0
    segments_with_risk = 0

    for segment_id in segment_ids:
        risk = segment_risks.get(segment_id)
        if risk is None:
            continue
        segments_with_risk += 1
        score = float(risk["riskScore"])
        available_scores.append(score)
        if risk["riskLevel"] == "HIGH" or score >= config.high_risk_threshold:
            high_risk_count += 1

    total_segments = len(segment_ids)
    segments_without_risk = total_segments - segments_with_risk
    coverage_ratio = segments_with_risk / total_segments
    coverage_percent = round(coverage_ratio * 100.0, 2)
    coverage_status = "complete" if coverage_ratio >= config.min_coverage_threshold else "insufficient"

    if available_scores:
        mean_risk = round(sum(available_scores) / len(available_scores), 2)
        max_risk = round(max(available_scores), 2)
        route_level = classify_risk_level(max_risk, config)
    else:
        mean_risk = None
        max_risk = None
        route_level = "UNKNOWN"

    return {
        "meanRisk": mean_risk,
        "maxRisk": max_risk,
        "highRiskSegmentCount": high_risk_count,
        "riskCoverage": coverage_percent,
        "riskCoverageStatus": coverage_status,
        "riskLevel": route_level,
        "segmentsWithRisk": segments_with_risk,
        "segmentsWithoutRisk": segments_without_risk,
    }


def _score_routes(routes: list[dict[str, Any]], config: RouteRiskConfig) -> None:
    eligible_routes = [
        route
        for route in routes
        if route["risk"]["riskCoverageStatus"] == "complete" and route["risk"]["meanRisk"] is not None
    ]

    if not eligible_routes:
        for route in routes:
            route["routeScore"] = None
        return

    distances = [float(route["distanceKm"]) for route in eligible_routes]
    risks = [float(route["risk"]["meanRisk"]) for route in eligible_routes]
    normalized_distances = _normalize(distances)
    normalized_risks = _normalize(risks)

    for route, normalized_distance, normalized_risk in zip(eligible_routes, normalized_distances, normalized_risks):
        route["routeScore"] = round(
            config.distance_weight * normalized_distance + config.risk_weight * normalized_risk,
            4,
        )

    for route in routes:
        if route not in eligible_routes:
            route["routeScore"] = None


def _select_recommended_route(routes: list[dict[str, Any]]) -> str | None:
    eligible = [route for route in routes if route.get("routeScore") is not None]
    if not eligible:
        return None
    return min(eligible, key=lambda route: route["routeScore"])["routeId"]


def enrich_routes_with_risk(
    route_response: dict[str, Any],
    departure_date: date,
    risk_service: RiskService,
    config: RouteRiskConfig | None = None,
) -> dict[str, Any]:
    config = config or risk_service.config
    routes = route_response.get("routes", [])
    enriched_routes: list[dict[str, Any]] = []

    for route in routes:
        segment_ids = list(route.get("roadSegmentIds", []))
        segment_risks = risk_service.lookup_segments(segment_ids, departure_date)
        road_segments = _build_road_segments(segment_ids, segment_risks)
        risk_summary = _calculate_route_risk(segment_ids, segment_risks, config)

        enriched_route = {
            **route,
            "roadSegments": road_segments,
            "risk": {
                "meanRisk": risk_summary["meanRisk"],
                "maxRisk": risk_summary["maxRisk"],
                "highRiskSegmentCount": risk_summary["highRiskSegmentCount"],
                "riskCoverage": risk_summary["riskCoverage"],
                "riskCoverageStatus": risk_summary["riskCoverageStatus"],
                "riskLevel": risk_summary["riskLevel"],
            },
        }
        enriched_routes.append(enriched_route)

    _score_routes(enriched_routes, config)
    recommended_route_id = _select_recommended_route(enriched_routes)

    return {
        **route_response,
        "departureDate": departure_date.isoformat(),
        "recommendedRouteId": recommended_route_id,
        "routes": enriched_routes,
        "riskMetadata": {
            "description": "AI-derived environmental risk based on Isolation Forest predictions.",
            "minCoverageThresholdPercent": round(config.min_coverage_threshold * 100.0, 2),
            "scoringWeights": {
                "distance": config.distance_weight,
                "risk": config.risk_weight,
            },
        },
    }
