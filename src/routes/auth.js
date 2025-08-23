const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateBody } = require('../middlewares/validate');
const { registerSchema, loginSchema, refreshSchema } = require('../validation/authSchemas');
const { auth: authLimiter } = require('../middlewares/rateLimiter');

router.post('/signup', authLimiter, validateBody(registerSchema), authController.signup);
router.post('/login', authLimiter, validateBody(loginSchema), authController.login);
router.post('/refresh', authLimiter, validateBody(refreshSchema), authController.refresh);
router.post('/logout', authLimiter, validateBody(refreshSchema), authController.logout);

module.exports = router;