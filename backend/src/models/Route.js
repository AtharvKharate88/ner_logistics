const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  request: mongoose.Schema.Types.Mixed,
  response: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Route', routeSchema);
