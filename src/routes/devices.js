
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { default: rateLimiter } = require('../middlewares/rateLimiter');
const deviceController = require('../controllers/deviceController');
const logController = require('../controllers/logController');

const { validateBody } = require('../middlewares/validate');
const { createDeviceSchema, updateDeviceSchema } = require('../validation/deviceSchemas');
const { heartbeatSchema } = require('../validation/heartbeatSchemas');


router.post('/', auth, rateLimiter, validateBody(createDeviceSchema), deviceController.createDevice);


router.get('/', auth, rateLimiter, deviceController.getDevices);
router.get('/:id', auth, rateLimiter, deviceController.getDeviceById);


router.patch('/:id', auth, rateLimiter, validateBody(updateDeviceSchema), deviceController.updateDevice);
router.delete('/:id', auth, rateLimiter, deviceController.deleteDevice);

router.post('/:id/heartbeat', auth, rateLimiter, validateBody(heartbeatSchema), deviceController.heartbeat);


router.post('/:id/logs', auth, rateLimiter, logController.createLog);
router.get('/:id/logs', auth, rateLimiter, logController.getLogs);
router.get('/:id/usage', auth, rateLimiter, logController.getUsage);

module.exports = router;
