const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  latitude: Number,
  longitude: Number,
  date: String,
  rainfall1d: Number,
  rainfall3d: Number,
  rainfall7d: Number,
  elevation: Number,
  slope: Number,
  historicalLandslides: Number,
  riskScore: Number,
  riskLevel: String,
  probability: Number,
  factors: {
    rainfall: {
      level: String,
      contribution: Number
    },
    landslide: {
      level: String,
      contribution: Number
    },
    terrain: {
      level: String,
      contribution: Number
    }
  },
  recommendation: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Prediction', predictionSchema);
