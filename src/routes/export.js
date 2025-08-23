const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { export: exportLimiter } = require('../middlewares/rateLimiter');
const { validateBody } = require('../middlewares/validate');
const { exportSchema } = require('../validation/exportSchemas');
const exportController = require('../controllers/exportController');

// Export endpoints
router.post('/', auth, exportLimiter, validateBody(exportSchema), exportController.enqueueExport);
router.get('/', auth, exportLimiter, exportController.listExports);
router.get('/:id/status', auth, exportLimiter, exportController.getStatus);
router.get('/:id/download', auth, exportLimiter, exportController.download);

module.exports = router;