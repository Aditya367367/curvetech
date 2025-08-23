const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

// Health check endpoint
router.get('/', healthController.healthCheck);

// Metrics endpoint
router.get('/metrics', healthController.getMetrics);

// System info endpoint
router.get('/system', healthController.getSystemInfo);

module.exports = router;
