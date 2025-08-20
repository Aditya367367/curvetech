const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true, index: true },
  event: { type: String, required: true },
  value: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('Log', logSchema);
