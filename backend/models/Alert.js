const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, 'Please specify a hazard category'],
      enum: ['fire', 'flood', 'medical', 'accident', 'earthquake', 'other']
    },
    severity: {
      type: String,
      required: [true, 'Please specify the severity level'],
      enum: ['low', 'medium', 'high', 'critical']
    },
    location: {
      type: String,
      required: [true, 'Please specify the address or location description']
    },
    latitude: {
      type: Number,
      required: [true, 'Please specify latitude coordinates']
    },
    longitude: {
      type: Number,
      required: [true, 'Please specify longitude coordinates']
    },
    description: {
      type: String,
      required: [true, 'Please describe the emergency incident']
    },
    imageUrl: {
      type: String
    },
    resolved: {
      type: Boolean,
      default: false
    },
    reporter: {
      type: String,
      required: [true, 'Reporter account is required']
    },
    assignedAgency: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Alert', AlertSchema);
