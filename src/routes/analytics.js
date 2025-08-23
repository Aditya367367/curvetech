const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { analytics: analyticsLimiter } = require('../middlewares/rateLimiter');
const analyticsController = require('../controllers/analyticsController');
const { validateQuery } = require('../middlewares/validate');
const { summaryQuerySchema } = require('../validation/analyticsSchemas');
const { devicesListCache, deviceLogsCache, deviceUsageCache } = require('../middlewares/cache');

// Analytics endpoints with caching
router.get('/summary', auth, analyticsLimiter, validateQuery(summaryQuerySchema), analyticsController.getSummary);
router.get('/devices/:id', auth, analyticsLimiter, analyticsController.getDeviceAnalytics);
router.get('/system', auth, analyticsLimiter, analyticsController.getSystemMetrics);

module.exports = router;