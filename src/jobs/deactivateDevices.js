const cron = require('node-cron');
const Device = require('../models/Device');
const { invalidateAllDevices } = require('../middlewares/cache');
async function deactivateInactiveDevices() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const res = await Device.updateMany(
    { last_active_at: { $lt: cutoff }, status: 'active' },
    { $set: { status: 'inactive' } }
  );
  if (process.env.NODE_ENV !== 'test') {
    console.log('Auto-deactivated devices:', res.modifiedCount);
  }
  await invalidateAllDevices().catch(() => {});
}

module.exports = function startDeactivateJob() {
  cron.schedule('0 * * * *', deactivateInactiveDevices);
};
module.exports.deactivateInactiveDevices = deactivateInactiveDevices;
