const routeRiskService = require('../services/route-risk.service');
const Incident = require('../models/Incident');

const planRoute = async (req, res) => {
  const { origin, destination, departureDate, cargoType, weight } = req.body || {};

  if (!origin || !destination) {
    return res.status(400).json({
      success: false,
      message: 'Origin and destination are required.'
    });
  }

  if (!departureDate) {
    return res.status(400).json({
      success: false,
      message: 'departureDate is required and must use YYYY-MM-DD format.'
    });
  }

  try {
    const response = await routeRiskService.planRouteWithRisk({
      origin,
      destination,
      departureDate,
      cargoType,
      weight
    });
    return res.json(response);
  } catch (error) {
    const statusCode = error.statusCode || 502;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Route planning failed.'
    });
  }
};

const getRouteById = async (req, res) => {
  const { routeId } = req.params;

  try {
    const route = await routeService.getRouteById(routeId);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found.'
      });
    }
    return res.json({ success: true, route });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Route lookup failed.'
    });
  }
};

const createIncident = async (req, res) => {
  const { latitude, longitude, type, severity, description } = req.body || {};

  if (latitude === undefined || longitude === undefined || !type) {
    return res.status(400).json({
      success: false,
      message: 'Latitude, longitude, and type are required.'
    });
  }

  try {
    const incident = await Incident.create({
      latitude,
      longitude,
      type,
      severity,
      description,
      status: 'reported'
    });

    return res.status(201).json({
      success: true,
      incidentId: incident._id,
      status: incident.status
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Incident save failed.'
    });
  }
};

module.exports = {
  planRoute,
  getRouteById,
  createIncident
};
