
const responseTime = require('response-time');

module.exports = responseTime((req, res, time) => {
  if (time > 300) {
    console.warn(`[SLOW] ${req.method} ${req.originalUrl} took ${time.toFixed(1)} ms`);
  }
});
