const mongoose = require('mongoose');

const routeRequestSchema = new mongoose.Schema({
  origin: String,
  destination: String,
  departureDate: String,
  cargoType: String,
  weight: Number,
  vehicleType: String,
  recommendedRouteId: String,
  request: mongoose.Schema.Types.Mixed,
  response: mongoose.Schema.Types.Mixed
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

routeRequestSchema.index({ createdAt: -1 });

module.exports =
  mongoose.models.RouteRequest ||
  mongoose.model('RouteRequest', routeRequestSchema);
