const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      required: true
    },

    title: {
      type: String,
      required: true
    },

    message: {
      type: String,
      required: true
    },

    latitude: {
      type: Number,
      required: true
    },

    longitude: {
      type: Number,
      required: true
    },

    radiusKm: {
      type: Number,
      default: 5
    },

    severity: {
      type: String,
      default: 'MEDIUM'
    },

    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED'],
      default: 'ACTIVE'
    },

    expiresAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Alert', alertSchema);