/**
 * DEMO / FALLBACK route generator.
 *
 * Used only when the Python route-engine service is unavailable.
 * This is NOT a substitute for graph routing or ML risk scoring.
 * Replace by ensuring PYTHON_SERVICE_URL / route-engine is running.
 */

const haversineKm = (a, b) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const earthKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthKm * Math.asin(Math.sqrt(h));
};

const midpoint = (a, b, offset = 0) => ({
  lat: (a.lat + b.lat) / 2 + offset,
  lon: (a.lon + b.lon) / 2 + offset * 0.6
});

const lineGeometry = (points) => ({
  type: 'LineString',
  coordinates: points.map((point) => [point.lon, point.lat])
});

const buildDemoRoutes = ({ origin, destination, departureDate, cargoType, weight }) => {
  const baseDistance = Math.max(haversineKm(origin, destination), 1);
  const midA = midpoint(origin, destination, 0.18);
  const midB = midpoint(origin, destination, -0.22);

  const variants = [
    {
      routeId: 'demo_route_1',
      distanceFactor: 1.18,
      timeFactor: 1.22,
      riskScore: 28,
      riskLevel: 'LOW',
      highRiskSegmentCount: 1,
      bend: midA
    },
    {
      routeId: 'demo_route_2',
      distanceFactor: 1.28,
      timeFactor: 1.35,
      riskScore: 54,
      riskLevel: 'MEDIUM',
      highRiskSegmentCount: 3,
      bend: midB
    },
    {
      routeId: 'demo_route_3',
      distanceFactor: 1.12,
      timeFactor: 1.15,
      riskScore: 71,
      riskLevel: 'HIGH',
      highRiskSegmentCount: 5,
      bend: midpoint(origin, destination, 0.05)
    }
  ];

  // Deterministic variation from request fields so responses depend on input.
  const cargoBump = String(cargoType || '').length % 5;
  const weightBump = Math.min(Math.floor(Number(weight) / 250), 8);

  const routes = variants.map((variant, index) => {
    const distanceKm = Number((baseDistance * variant.distanceFactor + cargoBump).toFixed(1));
    const estimatedTimeHours = Number(
      ((distanceKm / 42) * variant.timeFactor + weightBump * 0.05).toFixed(2)
    );
    const score = Number((variant.riskScore + cargoBump + weightBump * 0.3).toFixed(1));

    return {
      routeId: variant.routeId,
      distanceKm,
      estimatedTimeHours,
      routeScore: Number((0.35 * (distanceKm / (baseDistance * 1.4)) + 0.65 * (score / 100)).toFixed(4)),
      risk: {
        meanRisk: score,
        maxRisk: score + 12 + index,
        highRiskSegmentCount: variant.highRiskSegmentCount,
        riskCoverage: 86 - index * 4,
        riskCoverageStatus: 'complete',
        riskLevel: variant.riskLevel
      },
      geometry: lineGeometry([origin, variant.bend, destination])
    };
  });

  const recommended = [...routes].sort((a, b) => a.routeScore - b.routeScore)[0];

  return {
    origin: { lat: origin.lat, lon: origin.lon },
    destination: { lat: destination.lat, lon: destination.lon },
    departureDate,
    riskLookupDate: departureDate,
    recommendedRouteId: recommended.routeId,
    routes,
    riskMetadata: {
      description:
        'DEMO FALLBACK: approximate corridors generated because the Python route engine was unavailable.',
      mode: 'demo-fallback',
      minCoverageThresholdPercent: 70,
      scoringWeights: {
        distance: 0.35,
        risk: 0.65
      }
    },
    demoFallback: true
  };
};

module.exports = {
  buildDemoRoutes
};
