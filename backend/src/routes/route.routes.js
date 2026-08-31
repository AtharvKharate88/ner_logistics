const express = require('express');
const { planRoute, getRouteById, getHistory, createIncident } = require('../controllers/route.controller');
const { validatePlanRoute } = require('../middleware/validation.middleware');

const router = express.Router();

router.post('/routes/plan', validatePlanRoute, planRoute);
router.get('/routes/history', getHistory);
router.get('/routes/:routeId', getRouteById);
router.post('/incidents', createIncident);

module.exports = router;
