const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

// Different rate limits for different types of endpoints
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    keyGenerator: (req) => {
      // In test environment, use a combination for better tracking
      if (process.env.NODE_ENV === 'test') {
        return `${req.ip}:${req.path}:${req.body?.email || 'anonymous'}`;
      }
      // Use user ID if authenticated, otherwise use IP
      return req.user && req.user._id ? req.user._id.toString() : ipKeyGenerator(req);
    },
    message: { success: false, message: message || 'Too many requests' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: message || 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Default rate limiter (100 requests per 15 minutes)
const defaultLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  'Too many requests'
);

// Strict rate limiter for auth endpoints (5 requests per 15 minutes)
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 requests
  'Too many authentication attempts'
);

// Analytics rate limiter (50 requests per 15 minutes, higher for tests)
const analyticsLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  process.env.NODE_ENV === 'test' ? 100 : 50, // Higher limit for tests
  'Too many analytics requests'
);

// Export rate limiter (10 requests per hour)
const exportLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10, // 10 requests
  'Too many export requests'
);

module.exports = {
  default: defaultLimiter,
  auth: authLimiter,
  analytics: analyticsLimiter,
  export: exportLimiter
};
