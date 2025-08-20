const Device = require('../models/Device');

exports.createDevice = async (req, res, next) => {
  try {
    const { name, type, status } = req.body;
    const device = new Device({ name, type, status: status || 'inactive', owner: req.user._id });
    await device.save();
    res.json({ success: true, device });
  } catch(err) { next(err); }
};

exports.getDevices = async (req, res, next) => {
  try {
    const filter = { owner: req.user._id };
    if(req.query.type) filter.type = req.query.type;
    if(req.query.status) filter.status = req.query.status;
    const devices = await Device.find(filter);
    res.json({ success: true, devices });
  } catch(err) { next(err); }
};
exports.getDeviceById = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id);
    if(!device) return res.status(404).json({ success:false, message:'Device not found' });
    if(device.owner.toString() !== req.user._id.toString()) return res.status(403).json({ success:false, message:'Forbidden' });

    res.json({ success: true, device });
  } catch(err) { next(err); }
};

exports.updateDevice = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id);
    if(!device) return res.status(404).json({ success:false, message:'Device not found' });
    if(device.owner.toString() !== req.user._id.toString()) return res.status(403).json({ success:false, message:'Forbidden' });

    const allowed = ['name','type','status'];
    allowed.forEach(key => { if(req.body[key] !== undefined) device[key] = req.body[key]; });
    await device.save();
    res.json({ success: true, device });
  } catch(err) { next(err); }
};

exports.deleteDevice = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });
    if (device.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Forbidden' });
    await device.deleteOne();

    res.json({ success: true, message: 'Device removed' });
  } catch (err) {
    next(err);
  }
};
exports.heartbeat = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id);
    if(!device) return res.status(404).json({ success:false, message:'Device not found' });
    if(device.owner.toString() !== req.user._id.toString()) return res.status(403).json({ success:false, message:'Forbidden' });

    if(req.body.status) device.status = req.body.status;
    device.last_active_at = new Date();
    await device.save();

    res.json({ success: true, message: 'Device heartbeat recorded', last_active_at: device.last_active_at });
  } catch(err) { next(err); }
};
