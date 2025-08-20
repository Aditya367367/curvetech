const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true, index: true },
  status: { type: String, enum: ['active','inactive'], default: 'inactive', index: true },
  last_active_at: { type: Date, default: null },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

deviceSchema.index({ owner: 1 });
deviceSchema.index({ last_active_at: 1 });

module.exports = mongoose.model('Device', deviceSchema);
