
const Joi = require('joi');

const heartbeatSchema = Joi.object({
  status: Joi.string().valid('active','inactive','maintenance').optional(),
  metrics: Joi.object({
    battery: Joi.number().min(0).max(100).optional(),
    temperature: Joi.number().min(-100).max(200).optional(),
    signalStrength: Joi.number().min(0).max(100).optional()
  }).optional()
});

module.exports = { heartbeatSchema };
