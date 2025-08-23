const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  event: { type: String, required: true },
  value: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Compound indexes for better query performance
logSchema.index({ device: 1, timestamp: -1 });
logSchema.index({ device: 1, event: 1 });
logSchema.index({ event: 1, timestamp: -1 });
logSchema.index({ timestamp: -1 });
logSchema.index({ device: 1, event: 1, timestamp: -1 });

// TTL index for automatic cleanup of old logs (keep for 1 year)
logSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

module.exports = mongoose.model('Log', logSchema);
