import "./RouteInsights.css";

function RouteInsights({ analysis = null, recommendedReason = "", selectedRoute = null }) {
  const reasons =
    (Array.isArray(analysis?.reasons) && analysis.reasons.length
      ? analysis.reasons
      : null) ||
    (recommendedReason ? [recommendedReason] : []) ||
    [];

  const summary = analysis?.summary || recommendedReason || "";

  return (
    <section className="route-insights" aria-labelledby="route-insights-title">
      <div className="route-insights__header">
        <h2 id="route-insights-title">Why This Route?</h2>
        <p>
          Route intelligence from the planning engine
          {selectedRoute?.routeId ? ` for ${selectedRoute.routeId}` : ""}.
        </p>
      </div>

      <div className="route-insights__card">
        {summary ? <p className="route-insights__summary">{summary}</p> : null}

        {reasons.length ? (
          <ul className="route-insights__list">
            {reasons.map((reason) => (
              <li key={reason}>
                <span aria-hidden="true">✓</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="route-insights__empty">
            Plan a route to see why a corridor is recommended, including risk coverage and
            distance trade-offs from the route engine.
          </p>
        )}

        {analysis?.disclaimer ? (
          <p className="route-insights__disclaimer">{analysis.disclaimer}</p>
        ) : null}
      </div>
    </section>
  );
}

export default RouteInsights;
