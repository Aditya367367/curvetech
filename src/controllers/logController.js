const Log = require('../models/Log');
const Device = require('../models/Device');
const { invalidateDeviceComputed } = require('../middlewares/cache');

function parseRange(r = '24h'){
  const m = r.match(/^(\d+)([smhd])$/);
  if(!m) return 24*60*60*1000;
  const n = parseInt(m[1], 10);
  const unit = m[2];
  const multipliers = { s:1000, m:60*1000, h:60*60*1000, d:24*60*60*1000 };
  return n * multipliers[unit];
}

exports.createLog = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id);
    if(!device) return res.status(404).json({ success:false, message:'Device not found' });
    if(device.owner.toString() !== req.user._id.toString()) return res.status(403).json({ success:false, message:'Forbidden' });

    const { event, value } = req.body;
    if (!event) return res.status(400).json({ success:false, message:'Event is required' });
    const log = await new Log({ device: device._id, event, value }).save();
    invalidateDeviceComputed(device._id.toString()).catch(() => {});
    res.json({ success:true, log });
  } catch(err) { next(err); }
};

exports.getLogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10; 
    const device = await Device.findById(req.params.id);
    if(!device) return res.status(404).json({ success:false, message:'Device not found' });
    if(device.owner.toString() !== req.user._id.toString()) return res.status(403).json({ success:false, message:'Forbidden' });

    const logs = await Log.find({ device: device._id }).sort({ timestamp: -1 }).limit(limit);
    res.json({ success: true, logs });
  } catch(err) { next(err); }
};

exports.getUsage = async (req, res, next) => {
  try {
    const range = req.query.range || '24h';
    const ms = parseRange(range);
    const since = new Date(Date.now() - ms);

    const device = await Device.findById(req.params.id);
    if(!device) return res.status(404).json({ success:false, message:'Device not found' });
    if(device.owner.toString() !== req.user._id.toString()) return res.status(403).json({ success:false, message:'Forbidden' });

    const agg = await Log.aggregate([
      { $match: { device: device._id, timestamp: { $gte: since }, event: 'units_consumed' } },
      { $group: { _id: null, total: { $sum: '$value' } } }
    ]);

    const total = agg[0] ? agg[0].total : 0;
    res.json({ success:true, device_id: device._id, total_units_last_24h: total });
  } catch(err) { next(err); }
};
