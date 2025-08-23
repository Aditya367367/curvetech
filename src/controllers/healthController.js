const mongoose = require('mongoose');
const redis = require('../config/redis');
const Device = require('../models/Device');
const User = require('../models/User');
const Log = require('../models/Log');

// Simple metrics storage (in production, use a proper metrics service)
const metrics = {
  requestCount: 0,
  responseTimes: [],
  errorCount: 0,
  startTime: new Date()
};

exports.healthCheck = async (req, res) => {
  try {
    const checks = {
      server: true,
      database: false,
      redis: false,
      timestamp: new Date().toISOString()
    };

    // Check database connection
    try {
      if (mongoose.connection.readyState === 1) {
        checks.database = true;
      }
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    // Check Redis connection
    try {
      await redis.ping();
      checks.redis = true;
    } catch (error) {
      console.error('Redis health check failed:', error);
    }

    const isHealthy = checks.server && checks.database && checks.redis;
    const statusCode = isHealthy ? 200 : 503;

    res.status(statusCode).json({
      success: isHealthy,
      status: isHealthy ? 'healthy' : 'unhealthy',
      checks,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

exports.getMetrics = async (req, res) => {
  try {
    // Get basic system metrics
    const totalUsers = await User.countDocuments();
    const totalDevices = await Device.countDocuments();
    const activeDevices = await Device.countDocuments({ status: 'active' });
    const totalLogs = await Log.countDocuments();

    // Calculate average response time
    const avgResponseTime = metrics.responseTimes.length > 0 
      ? metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length 
      : 0;

    // Get recent activity (last hour)
    const recentLogs = await Log.countDocuments({
      timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
    });

    // Get database connection info
    const dbStats = {
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };

    // Get Redis info
    let redisInfo = null;
    try {
      redisInfo = await redis.info();
    } catch (error) {
      console.error('Failed to get Redis info:', error);
    }

    const result = {
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        startTime: metrics.startTime
      },
      requests: {
        total: metrics.requestCount,
        errors: metrics.errorCount,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        successRate: metrics.requestCount > 0 
          ? Math.round(((metrics.requestCount - metrics.errorCount) / metrics.requestCount) * 10000) / 100
          : 100
      },
      data: {
        users: totalUsers,
        devices: {
          total: totalDevices,
          active: activeDevices,
          inactive: totalDevices - activeDevices
        },
        logs: {
          total: totalLogs,
          recentHour: recentLogs
        }
      },
      connections: {
        database: dbStats,
        redis: redisInfo ? 'connected' : 'disconnected'
      },
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      metrics: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Middleware to track request metrics
exports.trackMetrics = (req, res, next) => {
  const startTime = Date.now();
  
  // Increment request count
  metrics.requestCount++;

  // Track response time
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    metrics.responseTimes.push(responseTime);
    
    // Keep only last 1000 response times to prevent memory leaks
    if (metrics.responseTimes.length > 1000) {
      metrics.responseTimes = metrics.responseTimes.slice(-1000);
    }

    // Track errors
    if (res.statusCode >= 400) {
      metrics.errorCount++;
    }
  });

  next();
};

// Get detailed system information
exports.getSystemInfo = async (req, res) => {
  try {
    const os = require('os');
    
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpuCount: os.cpus().length,
      loadAverage: os.loadavg(),
      uptime: os.uptime(),
      hostname: os.hostname(),
      networkInterfaces: os.networkInterfaces()
    };

    res.json({
      success: true,
      system: systemInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
