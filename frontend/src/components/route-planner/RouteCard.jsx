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

        <span className="route-card__action">
          {selected ? "Selected on map" : "View on map"}
        </span>
      </button>
    </article>
  );
}

export default RouteCard;
