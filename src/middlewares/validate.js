const Joi = require("joi");

function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        error: "validation_error",
        details: error.details.map((d) => d.message),
      });
    }

    req.body = value;
    next();
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        error: "validation_error",
        details: error.details.map((d) => d.message),
      });
    }

    req.query = value;
    next();
  };
}

module.exports = {
  validateBody,
  validateQuery,
};
