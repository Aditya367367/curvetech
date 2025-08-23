
const Joi = require('joi');

const createDeviceSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  type: Joi.string().required(),
  status: Joi.string().valid('active','inactive').optional()
});

const updateDeviceSchema = Joi.object({
  name: Joi.string().min(1).max(200).optional(),
  type: Joi.string().optional(),
  status: Joi.string().valid('active','inactive').optional()
});

module.exports = { createDeviceSchema, updateDeviceSchema };
