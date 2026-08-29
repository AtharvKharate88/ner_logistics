const Prediction = require('../models/Prediction');

const predictRisk = async (req, res) => {
  const payload = req.body || {};

  if (!payload.latitude || !payload.longitude) {
    return res.status(400).json({
      success: false,
      message: 'Latitude and longitude are required.'
    });
  }

  const response = {
    success: true,
    riskScore: 73,
    riskLevel: 'HIGH',
    probability: 0.73,
    factors: {
      rainfall: {
        level: 'HIGH',
        contribution: 82
      },
      landslide: {
        level: 'HIGH',
        contribution: 68
      },
      terrain: {
        level: 'MEDIUM',
        contribution: 54
      }
    },
    recommendation: 'Consider an alternative route.'
  };

  try {
    await Prediction.create({
      ...payload,
      ...response,
      factors: response.factors
    });
  } catch (error) {
    console.error('Risk prediction save failed:', error.message);
  }

  return res.json(response);
};

module.exports = {
  predictRisk
};
