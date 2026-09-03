const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: String,
      unique: true,
      required: true
    },

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },

    latitude: {
      type: Number,
      required: true
    },

    longitude: {
      type: Number,
      required: true
    },

    type: {
      type: String,
      required: true
    },

    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM'
    },

    description: {
      type: String,
      default: ''
    },

    photoUrl: {
      type: String,
      default: null
    },

    status: {
      type: String,
      enum: ['REPORTED', 'CONFIRMED', 'REJECTED', 'RESOLVED'],
      default: 'REPORTED'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Incident', incidentSchema);