const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    passwordHash: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ['FIELD_OFFICER', 'ADMIN'],
      required: true
    },

    officerId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);