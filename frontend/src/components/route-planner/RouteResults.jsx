import RouteCard from "./RouteCard";
import "./RouteResults.css";

function RouteResults({
  routes = [],
  recommendedRouteId = null,
  selectedRouteId = null,
  onSelect,
}) {
  if (!routes.length) {
    return (
      <section className="route-results" aria-labelledby="route-results-title">
        <div className="route-results__header">
          <h2 id="route-results-title">Route Results</h2>
          <p>Recommended and alternative corridors will appear here after planning.</p>
        </div>
        <div className="route-results__empty">
          <p>No routes planned yet.</p>
        </div>
      </section>
    );
  }

  const recommended =
    routes.find((route) => route.routeId === recommendedRouteId) || routes[0];
  const alternatives = routes.filter((route) => route.routeId !== recommended.routeId);

  return (
    <section className="route-results" aria-labelledby="route-results-title">
      <div className="route-results__header">
        <h2 id="route-results-title">Route Results</h2>
        <p>Select a corridor to highlight it on the map.</p>
      </div>

      <div className="route-results__grid">
        <RouteCard
          route={recommended}
          recommended
          selected={selectedRouteId === recommended.routeId}
          onSelect={onSelect}
        />

        {alternatives.map((route) => (
          <RouteCard
            key={route.routeId}
            route={route}
            selected={selectedRouteId === route.routeId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}

export default RouteResults;
