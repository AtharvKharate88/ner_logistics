const riskService = require('../services/risk.service');
const { predictRisk } = require('./riskController');

const getSegmentRisk = async (req, res, next) => {
  try {
    const response = await riskService.getSegmentRisk(req.params.id, req.query.date);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getSegmentRisk,
  predictRisk
};
