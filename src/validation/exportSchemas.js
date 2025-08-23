const Joi = require('joi');

const exportSchema = Joi.object({
  type: Joi.string().valid('devices', 'logs', 'analytics').required(),
  format: Joi.string().valid('json', 'csv').default('json'),
  filters: Joi.object({
    deviceId: Joi.string().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).optional(),
    event: Joi.string().optional(),
    type: Joi.string().optional(),
    status: Joi.string().valid('active', 'inactive').optional()
  }).optional()
});

module.exports = { exportSchema };