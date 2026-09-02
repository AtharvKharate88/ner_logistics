const routeService = require('./route.service');

const { AppError } = require('../middleware/error.middleware');

const getSegmentRisk = async (segmentId, departureDate) => {

  if (!segmentId) {
    throw new AppError('segment id is required.', 400);
  }

  if (!departureDate) {
    throw new AppError(
      'date query parameter is required and must use YYYY-MM-DD format.',
      400
    );
  }

  const payload = await routeService.getSegmentRisk(
    segmentId,
    departureDate
  );

  if (payload.riskAvailable === false) {
    return {
      success: true,
      roadSegmentId: segmentId,
      date: departureDate,
      riskAvailable: false,
      message: 'Risk data unavailable for this segment.'
    };
  }

  return {
    success: true,
    roadSegmentId: payload.roadSegmentId || segmentId,
    date: departureDate,
    riskAvailable: true,

    // Existing risk information
    anomalyScore: payload.anomalyScore,
    riskScore: payload.riskScore,
    riskLevel: payload.riskLevel,

    // Environmental/model features
    rainfall_1d: payload.rainfall_1d,
    rainfall_3d: payload.rainfall_3d,
    rainfall_7d: payload.rainfall_7d,
    slope: payload.slope,
    landslides_5km: payload.landslides_5km
  };
};
const getSegmentRiskHistory = async (segmentId, startDate, endDate) => {
  if (!segmentId) {
    throw new AppError('segment id is required.', 400);
  }

  if (!startDate || !endDate) {
    throw new AppError(
      'startDate and endDate query parameters are required and must use YYYY-MM-DD format.',
      400
    );
  }

  const payload = await routeService.getSegmentRiskHistory(
    segmentId,
    startDate,
    endDate
  );

  return {
    success: true,
    roadSegmentId: payload.roadSegmentId || segmentId,
    startDate: payload.startDate || startDate,
    endDate: payload.endDate || endDate,
    history: Array.isArray(payload.history) ? payload.history : []
  };
};
module.exports = {

  getSegmentRisk,
  getSegmentRiskHistory,
  validateDepartureDate: (departureDate) => {

    if (
      !departureDate ||
      typeof departureDate !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(departureDate)
    ) {
      return 'departureDate is required and must be a string in YYYY-MM-DD format.';
    }

    return null;
  }
};