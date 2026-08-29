const express = require('express');
const { planRoute, getRouteById, createIncident } = require('../controllers/routeController');

const router = express.Router();

router.post('/routes/plan', planRoute);
router.get('/routes/:routeId', getRouteById);
router.post('/incidents', createIncident);

module.exports = router;
