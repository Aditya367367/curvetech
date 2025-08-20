const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const rateLimiter = require('../middlewares/rateLimiter');
const deviceController = require('../controllers/deviceController');
const logController = require('../controllers/logController');


router.post('/', auth, rateLimiter, deviceController.createDevice);
router.get('/', auth, rateLimiter, deviceController.getDevices);
router.get('/:id', auth, rateLimiter, deviceController.getDeviceById);
router.patch('/:id', auth, rateLimiter, deviceController.updateDevice);
router.delete('/:id', auth, rateLimiter, deviceController.deleteDevice);
router.post('/:id/heartbeat', auth, rateLimiter, deviceController.heartbeat);

router.post('/:id/logs', auth, rateLimiter, logController.createLog);
router.get('/:id/logs', auth, rateLimiter, logController.getLogs);
router.get('/:id/usage', auth, rateLimiter, logController.getUsage);

module.exports = router;
