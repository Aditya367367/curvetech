const Device = require('../models/Device');
const Joi = require('joi');
const {
  invalidateUserDeviceLists,
  invalidateDeviceComputed
} = require('../middlewares/cache');
const { eventBus } = require('../realtime/eventBus'); 

const deviceSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().required(),
  status: Joi.string().valid('active', 'inactive').optional()
});


exports.createDevice = async (req, res, next) => {
  try {
    const { error, value } = deviceSchema.validate(req.body);
    if (error)
      return res.status(400).json({ success: false, message: error.details[0].message });

    const device = new Device({ ...value, owner: req.user._id });
    await device.save();

    invalidateUserDeviceLists(req.user._id.toString()).catch(() => {});

    res.json({ success: true, device });
  } catch (err) {
    next(err);
  }
};


exports.getDevices = async (req, res, next) => {
  try {
    const filter = { owner: req.user._id };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;

    const devices = await Device.find(filter);
    res.json({ success: true, devices });
  } catch (err) {
    next(err);
  }
};

exports.getDeviceById = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device)
      return res.status(404).json({ success: false, message: 'Device not found' });

    if (device.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Forbidden' });

    res.json({ success: true, device });
  } catch (err) {
    next(err);
  }
};

exports.updateDevice = async (req, res, next) => {
  try {
    const { error, value } = deviceSchema.validate(req.body, { allowUnknown: true });
    if (error)
      return res.status(400).json({ success: false, message: error.details[0].message });

    const device = await Device.findById(req.params.id);
    if (!device)
      return res.status(404).json({ success: false, message: 'Device not found' });

    if (device.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Forbidden' });

    Object.assign(device, value);
    await device.save();

    const userId = req.user._id.toString();
    invalidateUserDeviceLists(userId).catch(() => {});
    invalidateDeviceComputed(device._id.toString()).catch(() => {});

    res.json({ success: true, device });
  } catch (err) {
    next(err);
  }
};

exports.deleteDevice = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device)
      return res.status(404).json({ success: false, message: 'Device not found' });

    if (device.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Forbidden' });

    await device.deleteOne();

    const userId = req.user._id.toString();
    invalidateUserDeviceLists(userId).catch(() => {});
    invalidateDeviceComputed(device._id.toString()).catch(() => {});

    res.json({ success: true, message: 'Device removed' });
  } catch (err) {
    next(err);
  }
};

exports.heartbeat = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device)
      return res.status(404).json({ success: false, message: 'Device not found' });

    if (device.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Forbidden' });

    
    if (req.body.status) device.status = req.body.status;
    if (req.body.metrics) device.metrics = req.body.metrics;
    device.last_active_at = new Date();
    await device.save();

   
    invalidateUserDeviceLists(req.user._id.toString()).catch(() => {});
    invalidateDeviceComputed(device._id.toString()).catch(() => {});

    
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${req.user._id}`).emit('device:heartbeat', {
        id: device._id,
        last_active: device.last_active_at,
        status: device.status,
        metrics: device.metrics || {}
      });
    }

 
    eventBus.emit('device:heartbeat', {
      userId: req.user._id,
      data: {
        id: device._id,
        last_active: device.last_active_at,
        status: device.status,
        metrics: device.metrics || {}
      }
    });

    res.json({
      success: true,
      message: 'Device heartbeat recorded',
      last_active_at: device.last_active_at
    });
  } catch (err) {
    next(err);
  }
};
