require('dotenv').config();
const express = require('express');
require('express-async-errors'); 
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const analyticsRoutes = require('./routes/analytics');
const exportRoutes = require('./routes/export');
const healthRoutes = require('./routes/health');
const realtimeRoutes = require('./routes/realtime');

const errorHandler = require('./middlewares/errorHandler');
const responseTimeMw = require('./middlewares/responseTime');
const { trackMetrics } = require('./controllers/healthController');

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging with IP tracking
app.use(morgan('combined', {
  stream: {
    write: (message) => {
      console.log(message.trim());
    }
  }
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Response time tracking
app.use(responseTimeMw);

// Metrics tracking
app.use(trackMetrics);

// Health check (no auth required)
app.use('/health', healthRoutes);

// API routes
app.use('/auth', authRoutes);
app.use('/devices', deviceRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/export', exportRoutes);
app.use('/realtime', realtimeRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Device Management API',
    version: '2.0.0',
    endpoints: {
      auth: '/auth',
      devices: '/devices',
      analytics: '/analytics',
      export: '/export',
      realtime: '/realtime',
      health: '/health'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling
app.use(errorHandler);

module.exports = app;
