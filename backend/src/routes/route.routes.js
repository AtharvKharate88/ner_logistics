const express = require('express');
const { planRoute, getRouteById, getHistory, createIncident } = require('../controllers/route.controller');
const { validatePlanRoute } = require('../middleware/validation.middleware');
const { uploadIncidentPhoto } = require('../middleware/upload.middleware');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
router.post('/routes/plan', validatePlanRoute, planRoute);
router.get('/routes/history', getHistory);
router.get('/routes/:routeId', getRouteById);
router.post(
  '/incidents',
  authenticate,
  requireRole('FIELD_OFFICER'),
  uploadIncidentPhoto.single('photo'),
  createIncident
);

module.exports = router;
