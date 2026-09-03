import {
  formatDistance,
  formatDuration,
  formatRiskScore,
  normalizeRiskLevel,
  riskClass,
} from "../../utils/routeFormat";
import "./RouteCard.css";

function RouteCard({ route, recommended = false, selected = false, onSelect }) {
  const level = normalizeRiskLevel(route?.risk?.level);
  const coverage = route?.risk?.coveragePercent;
  const currentIncidents = Array.isArray(route?.currentIncidents)
  ? route.currentIncidents
  : [];

  return (
    <article
      className={[
        "route-card",
        recommended ? "route-card--recommended" : "",
        selected ? "route-card--selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        className="route-card__button"
        onClick={() => onSelect?.(route.routeId)}
        aria-pressed={selected}
      >
        <div className="route-card__top">
          <span className="route-card__badge">
            {recommended ? "★ Recommended Route" : route.routeId}
          </span>
          <span className={`route-card__risk ${riskClass(level)}`}>
            {level === "UNKNOWN" ? "Risk N/A" : `Risk: ${level}`}
          </span>
        </div>

        <div className="route-card__metrics">
          <div>
            <p className="route-card__metric-label">Distance</p>
            <p className="route-card__metric-value">{formatDistance(route.distanceKm)}</p>
          </div>
          <div>
            <p className="route-card__metric-label">Duration</p>
            <p className="route-card__metric-value">
              {formatDuration(route.estimatedTimeHours)}
            </p>
          </div>
          <div>
            <p className="route-card__metric-label">Risk Score</p>
            <p className="route-card__metric-value">
              {formatRiskScore(route?.risk?.score)}
            </p>
          </div>
          <div>
            <p className="route-card__metric-label">Risk Coverage</p>
            <p className="route-card__metric-value">
              {Number.isFinite(coverage) ? `${Math.round(coverage)}%` : "N/A"}
            </p>
          </div>
        </div>
        {currentIncidents.length > 0 ? (
          <div className="route-card__incident-warning" role="alert">
            <strong>⚠️ Current incident reported</strong>

            {currentIncidents.slice(0, 2).map((incident) => (
              <div key={incident.incidentId} className="route-card__incident">
                <span>
                  {incident.type} • {incident.severity}
                </span>

                <span>
                  {incident.distanceFromRouteKm === 0
                    ? "On route"
                    : `${incident.distanceFromRouteKm} km from route`}
                </span>
              </div>
            ))}

            {currentIncidents.length > 2 ? (
                <span>
                  +{currentIncidents.length - 2} more reported incidents
                </span>
            ) : null}
          </div>
        ) : null}
                <span className="route-card__action">
                  {selected ? "Selected on map" : "View on map"}
                </span>
              </button>
            </article>
          );
        }

export default RouteCard;
