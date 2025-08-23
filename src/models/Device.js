const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: String, enum: ['active','inactive'], default: 'inactive' },
  last_active_at: { type: Date, default: null },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  metrics: {
    battery: { type: Number, min: 0, max: 100 },
    temperature: { type: Number, min: -100, max: 200 },
    signalStrength: { type: Number, min: 0, max: 100 }
  }
}, { timestamps: true });

deviceSchema.index({ owner: 1, status: 1 });
deviceSchema.index({ owner: 1, type: 1 });
deviceSchema.index({ owner: 1, last_active_at: -1 });
deviceSchema.index({ status: 1, last_active_at: -1 });
deviceSchema.index({ type: 1, status: 1 });
deviceSchema.index({ last_active_at: 1 }, { expireAfterSeconds: 0 }); 

deviceSchema.index({ name: 'text', type: 'text' });

module.exports = mongoose.model('Device', deviceSchema);
