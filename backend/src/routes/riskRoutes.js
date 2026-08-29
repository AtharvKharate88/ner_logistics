const express = require('express');
const { predictRisk } = require('../controllers/riskController');

const router = express.Router();

router.post('/risk/predict', predictRisk);

module.exports = router;
