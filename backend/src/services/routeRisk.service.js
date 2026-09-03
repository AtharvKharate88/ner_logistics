const mongoose = require('mongoose');
const routeService = require('./route.service');
const RouteRequest = require('../models/routeRequest.model');
const { resolvePlace } = require('../config/cities');
const { AppError } = require('../middleware/error.middleware');
const { buildDemoRoutes } = require('./demoRoute.fallback');

const mapRoute = (route) => {
  const riskAvailable = route?.risk?.meanRisk !== null && route?.risk?.meanRisk !== undefined;
  const riskLevel = route?.risk?.riskLevel || 'UNKNOWN';

  return {
    routeId: route.routeId,
    distanceKm: route.distanceKm,
    estimatedTimeHours: route.estimatedTimeHours,
    routeScore: route.routeScore ?? null,
    risk: {
      available: riskAvailable,
      score: riskAvailable ? route.risk.meanRisk : null,
      maxScore: riskAvailable ? route.risk.maxRisk : null,
      level: riskAvailable ? riskLevel : 'UNAVAILABLE',
      coveragePercent: route.risk?.riskCoverage ?? null,
      coverageStatus: route.risk?.riskCoverageStatus || 'unavailable',
      highRiskSegmentCount: route.risk?.highRiskSegmentCount ?? 0
    },
    geometry: route.geometry || {}
  };
};

const buildAnalysis = (recommended, routes, weights, recommendedReason, demoFallback = false) => {
  const reasons = [];
  const disclaimer = demoFallback
    ? 'DEMO FALLBACK active: the Python route engine was unavailable. Values are approximate placeholders based on your request, not graph-routed corridors.'
    : 'Insights are derived from the existing route engine outputs (distance, risk coverage, and scoring weights), not a separate generative AI layer.';

  if (!recommended) {
    return {
      summary: recommendedReason,
      reasons: [
        'No recommended route could be ranked because risk coverage was insufficient.'
      ],
      disclaimer
    };
  }

  const alternatives = routes.filter((route) => route.routeId !== recommended.routeId);
  const shortest = routes.reduce((best, route) =>
    route.distanceKm < best.distanceKm ? route : best
    , routes[0]);

  if (recommended.risk?.available && recommended.risk.level === 'LOW') {
    reasons.push('Lower environmental risk relative to risk-scored alternatives.');
  } else if (recommended.risk?.available) {
    reasons.push(
      `Selected with risk level ${recommended.risk.level} using the configured distance/risk trade-off.`
    );
  }

  if (
    Number.isFinite(recommended.risk?.highRiskSegmentCount) &&
    alternatives.some(
      (route) =>
        Number.isFinite(route.risk?.highRiskSegmentCount) &&
        route.risk.highRiskSegmentCount > recommended.risk.highRiskSegmentCount
    )
  ) {
    reasons.push('Avoids more high-risk segments than one or more alternatives.');
  }

  if (
    Number.isFinite(recommended.risk?.coveragePercent) &&
    recommended.risk.coveragePercent >= 80
  ) {
    reasons.push(
      `Strong risk-data coverage (${Math.round(recommended.risk.coveragePercent)}%) along the corridor.`
    );
  }

  if (shortest && shortest.routeId === recommended.routeId) {
    reasons.push('Shortest distance among the returned feasible routes.');
  } else if (shortest) {
    reasons.push(
      `Balances travel distance against risk (distance weight ${weights.distance}, risk weight ${weights.risk}).`
    );
  }

  if (demoFallback) {
    reasons.unshift('Demo fallback corridor generated from submitted origin and destination.');
  }

  if (!reasons.length) {
    reasons.push(recommendedReason);
  }

  return {
    summary: recommendedReason,
    reasons,
    disclaimer
  };
};

const assertMongoReady = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new AppError('Database temporarily unavailable', 503);
  }
};

const planRouteWithRisk = async (validated) => {
  const origin = resolvePlace(validated.origin, 'origin');
  const destination = resolvePlace(validated.destination, 'destination');

  let engineResponse;
  let demoFallback = false;

  try {
    // Real route-engine integration point (Python FastAPI via route.service.js).
    engineResponse = await routeService.planRoute({
      origin: { lat: origin.lat, lon: origin.lon },
      destination: { lat: destination.lat, lon: destination.lon },
      departureDate: validated.departureDate,
      cargoType: validated.cargoType,
      weight: validated.weight
    });
  } catch (error) {
    // Isolated fallback so the frontend can still be exercised when the engine is down.
    if (error instanceof AppError && (error.statusCode === 503 || error.statusCode === 502)) {
      console.warn('Route engine unavailable — using demo fallback response.');
      engineResponse = buildDemoRoutes({
        origin: { lat: origin.lat, lon: origin.lon },
        destination: { lat: destination.lat, lon: destination.lon },
        departureDate: validated.departureDate,
        cargoType: validated.cargoType,
        weight: validated.weight
      });
      demoFallback = true;
    } else {
      throw error;
    }
  }

  if (!engineResponse.routes.length) {
    throw new AppError('No feasible route found between the selected locations.', 404);
  }

  const routes = engineResponse.routes.map(mapRoute);
  const recommendedRouteId = engineResponse.recommendedRouteId || null;
  const recommended = routes.find((route) => route.routeId === recommendedRouteId) || null;
  const weights = engineResponse.riskMetadata?.scoringWeights || { distance: 0.5, risk: 0.5 };

  const recommendedReason = demoFallback
    ? 'DEMO FALLBACK: recommended using approximate distance/risk placeholders because the route engine was unavailable.'
    : recommended
      ? `Selected by the existing route engine using distance weight ${weights.distance} and risk weight ${weights.risk}. Lower combined score is better.`
      : 'No recommended route: risk coverage was insufficient for ranking.';

  const response = {
    success: true,
    origin: origin.label,
    destination: destination.label,
    originCoordinates: { lat: origin.lat, lon: origin.lon },
    destinationCoordinates: { lat: destination.lat, lon: destination.lon },
    departureDate: validated.departureDate,
    cargoType: validated.cargoType,
    weight: validated.weight,
    vehicleType: validated.vehicleType,
    riskLookupDate: engineResponse.riskLookupDate || engineResponse.departureDate || validated.departureDate,
    recommendedRouteId,
    recommendedReason,
    demoFallback,
    analysis: buildAnalysis(recommended, routes, weights, recommendedReason, demoFallback),
    riskMetadata: engineResponse.riskMetadata,
    routes
  };

  try {
    assertMongoReady();
    await RouteRequest.create({
      origin: origin.label,
      destination: destination.label,
      departureDate: validated.departureDate,
      cargoType: validated.cargoType,
      weight: validated.weight,
      vehicleType: validated.vehicleType,
      recommendedRouteId,
      request: validated,
      response
    });
    response.historySaved = true;
  } catch (error) {
    console.error('Route history save failed:', error.message);
    response.historySaved = false;
    if (error instanceof AppError && error.statusCode === 503) {
      response.historyError = 'Database temporarily unavailable';
    }
  }

  return response;
};

const getHistory = async () => {
  assertMongoReady();

  const records = await RouteRequest.find()
    .select(
      'origin destination departureDate cargoType weight vehicleType recommendedRouteId createdAt'
    )
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return {
    success: true,
    routes: records.map((record) => ({
      origin: record.origin,
      destination: record.destination,
      departureDate: record.departureDate,
      cargoType: record.cargoType,
      weight: record.weight,
      vehicleType: record.vehicleType,
      recommendedRouteId: record.recommendedRouteId,
      createdAt: record.createdAt
    }))
  };
};

module.exports = {
  planRouteWithRisk,
  getHistory
};
