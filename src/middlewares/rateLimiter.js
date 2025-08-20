const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 100,
  keyGenerator: (req) => {
    
    return req.user && req.user.id ? req.user.id : ipKeyGenerator(req);
  },
  handler: (req, res) => {
    return res.status(429).json({ success: false, message: 'Too many requests. Try again later.' });
  }
});

module.exports = limiter;
