
const Joi = require('joi');

const summaryQuerySchema = Joi.object({
  start: Joi.date().iso().optional(),
  end: Joi.date().iso().greater(Joi.ref('start')).optional()
});

module.exports = { summaryQuerySchema };
