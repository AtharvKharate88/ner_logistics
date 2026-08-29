const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  latitude: Number,
  longitude: Number,
  type: String,
  severity: String,
  description: String,
  incidentId: String,
  status: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Incident', incidentSchema);
