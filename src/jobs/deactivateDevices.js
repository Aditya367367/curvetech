const cron = require('node-cron');
const Device = require('../models/Device');

module.exports = function startDeactivateJob(){
  
  cron.schedule('0 * * * *', async () => {
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const res = await Device.updateMany(
        { last_active_at: { $lt: cutoff }, status: 'active' },
        { $set: { status: 'inactive' } }
      );
      console.log('Auto-deactivated devices:', res.modifiedCount);
    } catch (err) {
      console.error('Error auto-deactivating devices', err);
    }
  });
};
