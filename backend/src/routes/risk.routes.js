const express = require('express');
const { getSegmentRisk, predictRisk } = require('../controllers/risk.controller');
const { validateSegmentRiskQuery } = require('../middleware/validation.middleware');

const router = express.Router();

router.get('/risk/segment/:id', validateSegmentRiskQuery, getSegmentRisk);
router.post('/risk/predict', predictRisk);

module.exports = router;
