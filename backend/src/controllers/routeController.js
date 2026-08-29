const Route = require('../models/Route');
const Incident = require('../models/Incident');

const planRoute = async (req, res) => {
  const { origin, destination, cargoType, weight, vehicleType } = req.body;

  if (!origin || !destination) {
    return res.status(400).json({
      success: false,
      message: 'Origin and destination are required.'
    });
  }

  const response = {
    success: true,
    recommendedRoute: {
      routeId: 'R001',
      distanceKm: 470,
      estimatedTimeHours: 11.3,
      riskScore: 18,
      riskLevel: 'LOW',
      routeReliability: 92,
      geometry: []
    },
    alternatives: [
      {
        routeId: 'R002',
        distanceKm: 510,
        estimatedTimeHours: 12.6,
        riskScore: 29,
        riskLevel: 'LOW',
        routeReliability: 87,
        geometry: []
      },
      {
        routeId: 'R003',
        distanceKm: 455,
        estimatedTimeHours: 10.8,
        riskScore: 61,
        riskLevel: 'HIGH',
        routeReliability: 61,
        geometry: []
      }
    ]
  };

  try {
    await Route.create({
      origin,
      destination,
      cargoType,
      weight,
      vehicleType,
      recommendedRoute: response.recommendedRoute,
      alternatives: response.alternatives
    });
  } catch (error) {
    console.error('Route save failed:', error.message);
  }

  return res.json(response);
};

const getRouteById = (req, res) => {
  const { routeId } = req.params;

  if (routeId !== 'R001') {
    return res.status(404).json({
      success: false,
      message: 'Route not found.'
    });
  }

  return res.json({
    routeId: 'R001',
    origin: 'Guwahati',
    destination: 'Imphal',
    distanceKm: 470,
    estimatedTimeHours: 11.3,
    riskScore: 18,
    riskLevel: 'LOW',
    reliability: 92,
    roadSegments: [],
    riskFactors: {
      weather: 12,
      terrain: 18,
      historicalDisruption: 9
    }
  });
};

const createIncident = async (req, res) => {
  const { latitude, longitude, type, severity, description } = req.body;

  if (!latitude || !longitude || !type) {
    return res.status(400).json({
      success: false,
      message: 'Latitude, longitude, and type are required.'
    });
  }

  const response = {
    success: true,
    incidentId: 'INC-1042',
    status: 'reported'
  };

  try {
    await Incident.create({
      latitude,
      longitude,
      type,
      severity,
      description,
      incidentId: response.incidentId,
      status: response.status
    });
  } catch (error) {
    console.error('Incident save failed:', error.message);
  }

  return res.status(201).json(response);
};

module.exports = {
  planRoute,
  getRouteById,
  createIncident
};
