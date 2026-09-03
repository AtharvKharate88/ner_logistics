const routeRiskService = require('../services/routeRisk.service');
const incidentService = require('../services/incident.service');
const Route = require('../models/Route');

const planRoute = async (req, res, next) => {
  try {
    const response = await routeRiskService.planRouteWithRisk(
      req.validatedPlan
    );

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

    return res.json({
      success: true,
      route
    });
  } catch (error) {
    return next(error);
  }
};

const createIncident = async (req, res, next) => {
  try {
    console.log('UPLOAD DEBUG:', req.file);
    const {
      latitude,
      longitude,
      type,
      severity,
      description
    } = req.body || {};

    if (
      latitude === undefined ||
      longitude === undefined ||
      !type
    ) {
      return res.status(400).json({
        success: false,
        message: 'Latitude, longitude, and type are required.'
      });
    }

    const photoUrl = req.file
        ? `${req.protocol}://${req.get('host')}/uploads/incidents/${req.file.filename}`
        : null;

    const { incident, alert } =
      await incidentService.createIncident({
        reportedBy: req.user?._id,
        latitude: Number(latitude),
        longitude: Number(longitude),
        type,
        severity: severity || 'MEDIUM',
        description: description || '',
        photoUrl
      });

    return res.status(201).json({
      success: true,
      incident: {
        incidentId: incident.incidentId,
        id: incident._id,
        latitude: incident.latitude,
        longitude: incident.longitude,
        type: incident.type,
        severity: incident.severity,
        description: incident.description,
        photoUrl: incident.photoUrl,
        status: incident.status,
        createdAt: incident.createdAt
      },
      alert: {
        id: alert._id,
        title: alert.title,
        message: alert.message,
        radiusKm: alert.radiusKm,
        severity: alert.severity,
        status: alert.status,
        createdAt: alert.createdAt
      }
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