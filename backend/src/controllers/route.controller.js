const routeRiskService = require('../services/routeRisk.service');
const Incident = require('../models/Incident');
const Route = require('../models/Route');

const planRoute = async (req, res, next) => {
  try {
    const response = await routeRiskService.planRouteWithRisk(req.validatedPlan);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const response = await routeRiskService.getHistory();
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

const getRouteById = async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.routeId).lean();
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found.'
      });
    }
    return res.json({ success: true, route });
  } catch (error) {
    return next(error);
  }
};

const createIncident = async (req, res, next) => {
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
    return next(error);
  }
};

module.exports = {
  planRoute,
  getHistory,
  getRouteById,
  createIncident
};
