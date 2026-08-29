const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeId: String,
  origin: {
    name: String,
    lat: Number,
    lng: Number
  },
  destination: {
    name: String,
    lat: Number,
    lng: Number
  },
  cargoType: String,
  weight: Number,
  vehicleType: String,
  recommendedRoute: {
    routeId: String,
    distanceKm: Number,
    estimatedTimeHours: Number,
    riskScore: Number,
    riskLevel: String,
    routeReliability: Number,
    geometry: [Object]
  },
  alternatives: [
    {
      routeId: String,
      distanceKm: Number,
      estimatedTimeHours: Number,
      riskScore: Number,
      riskLevel: String,
      routeReliability: Number,
      geometry: [Object]
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Route', routeSchema);
