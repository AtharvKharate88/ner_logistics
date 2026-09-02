const riskService = require('../services/risk.service');

const { predictRisk } = require('./riskController');

const getSegmentRisk = async (req, res, next) => {
  try {
    const response = await riskService.getSegmentRisk(
      req.params.id,
      req.query.date
    );

    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

const getSegmentRiskHistory = async (req, res, next) => {
  try {
    const response = await riskService.getSegmentRiskHistory(
      req.params.id,
      req.query.startDate,
      req.query.endDate
    );

    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getSegmentRisk,
  getSegmentRiskHistory,
  predictRisk
};