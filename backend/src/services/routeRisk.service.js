const mongoose = require('mongoose');
const routeService = require('./route.service');
const RouteRequest = require('../models/routeRequest.model');
const { resolvePlace } = require('../config/cities');
const { AppError } = require('../middleware/error.middleware');

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

const assertMongoReady = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new AppError('Database temporarily unavailable', 503);
  }
};

const planRouteWithRisk = async (validated) => {
  const origin = resolvePlace(validated.origin, 'origin');
  const destination = resolvePlace(validated.destination, 'destination');

  const engineResponse = await routeService.planRoute({
    origin: { lat: origin.lat, lon: origin.lon },
    destination: { lat: destination.lat, lon: destination.lon },
    departureDate: validated.departureDate,
    cargoType: validated.cargoType,
    weight: validated.weight
  });

  if (!engineResponse.routes.length) {
    throw new AppError('No feasible route found between the selected locations.', 404);
  }

  const routes = engineResponse.routes.map(mapRoute);
  const recommendedRouteId = engineResponse.recommendedRouteId || null;
  const recommended = routes.find((route) => route.routeId === recommendedRouteId) || null;
  const weights = engineResponse.riskMetadata?.scoringWeights || { distance: 0.5, risk: 0.5 };

  const response = {
    success: true,
    origin: origin.label,
    destination: destination.label,
    departureDate: validated.departureDate,
    riskLookupDate: engineResponse.riskLookupDate || engineResponse.departureDate || validated.departureDate,
    recommendedRouteId,
    recommendedReason: recommended
      ? `Selected by the existing route engine using distance weight ${weights.distance} and risk weight ${weights.risk}. Lower combined score is better.`
      : 'No recommended route: risk coverage was insufficient for ranking.',
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
