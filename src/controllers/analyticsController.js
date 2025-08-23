const Device = require('../models/Device');
const Log = require('../models/Log');
const User = require('../models/User');
const redis = require('../config/redis');

// Cache analytics data for 5 minutes as per requirements
const ANALYTICS_CACHE_TTL = 5 * 60;

async function getCachedAnalytics(key) {
  try {
    const cached = await redis.get(`analytics:${key}`);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

async function setCachedAnalytics(key, data) {
  try {
    await redis.setex(`analytics:${key}`, ANALYTICS_CACHE_TTL, JSON.stringify(data));
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

exports.getSummary = async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const userId = req.user._id;
    
    // Create cache key based on user and date range
    const cacheKey = `summary:${userId}:${start || 'all'}:${end || 'all'}`;
    
    // Try to get from cache first
    const cached = await getCachedAnalytics(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        cached: true,
        ...cached
      });
    }

    // Build date filter
    const dateFilter = {};
    if (start || end) {
      dateFilter.createdAt = {};
      if (start) dateFilter.createdAt.$gte = new Date(start);
      if (end) dateFilter.createdAt.$lte = new Date(end);
    }

    // Get device statistics
    const deviceStats = await Device.aggregate([
      { $match: { owner: userId, ...dateFilter } },
      {
        $group: {
          _id: null,
          totalDevices: { $sum: 1 },
          activeDevices: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          inactiveDevices: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
          avgLastActive: { $avg: '$last_active_at' }
        }
      }
    ]);

    // Get device type distribution
    const typeDistribution = await Device.aggregate([
      { $match: { owner: userId, ...dateFilter } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get usage statistics from logs
    const usageStats = await Log.aggregate([
      {
        $lookup: {
          from: 'devices',
          localField: 'device',
          foreignField: '_id',
          as: 'deviceInfo'
        }
      },
      { $unwind: '$deviceInfo' },
      { $match: { 'deviceInfo.owner': userId } },
      {
        $group: {
          _id: null,
          totalLogs: { $sum: 1 },
          totalUnitsConsumed: { $sum: { $cond: [{ $eq: ['$event', 'units_consumed'] }, '$value', 0] } },
          avgValue: { $avg: '$value' }
        }
      }
    ]);

    // Get recent activity (last 7 days)
    const recentActivity = await Log.aggregate([
      {
        $lookup: {
          from: 'devices',
          localField: 'device',
          foreignField: '_id',
          as: 'deviceInfo'
        }
      },
      { $unwind: '$deviceInfo' },
      { $match: { 'deviceInfo.owner': userId } },
      {
        $match: {
          timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 },
          totalValue: { $sum: '$value' }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 7 }
    ]);

    const result = {
      deviceStats: deviceStats[0] || {
        totalDevices: 0,
        activeDevices: 0,
        inactiveDevices: 0,
        avgLastActive: null
      },
      typeDistribution,
      usageStats: usageStats[0] || {
        totalLogs: 0,
        totalUnitsConsumed: 0,
        avgValue: 0
      },
      recentActivity,
      generatedAt: new Date().toISOString()
    };

    // Cache the result
    await setCachedAnalytics(cacheKey, result);

    res.json({
      success: true,
      cached: false,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

exports.getDeviceAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { start, end } = req.query;
    const userId = req.user._id;

    // Verify device ownership
    const device = await Device.findOne({ _id: id, owner: userId });
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    const cacheKey = `device_analytics:${id}:${start || 'all'}:${end || 'all'}`;
    
    // Try cache first
    const cached = await getCachedAnalytics(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        cached: true,
        ...cached
      });
    }

    // Build date filter
    const dateFilter = {};
    if (start || end) {
      dateFilter.timestamp = {};
      if (start) dateFilter.timestamp.$gte = new Date(start);
      if (end) dateFilter.timestamp.$lte = new Date(end);
    }

    // Get device-specific analytics
    const logs = await Log.find({ device: id, ...dateFilter }).sort({ timestamp: -1 });

    // Calculate hourly usage for the last 24 hours
    const hourlyUsage = await Log.aggregate([
      { $match: { device: id, event: 'units_consumed' } },
      {
        $match: {
          timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $hour: '$timestamp' },
          totalValue: { $sum: '$value' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get event distribution
    const eventDistribution = await Log.aggregate([
      { $match: { device: id, ...dateFilter } },
      {
        $group: {
          _id: '$event',
          count: { $sum: 1 },
          totalValue: { $sum: '$value' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const result = {
      device: {
        id: device._id,
        name: device.name,
        type: device.type,
        status: device.status,
        lastActive: device.last_active_at
      },
      logs: {
        total: logs.length,
        recent: logs.slice(0, 10) // Last 10 logs
      },
      hourlyUsage,
      eventDistribution,
      generatedAt: new Date().toISOString()
    };

    // Cache the result
    await setCachedAnalytics(cacheKey, result);

    res.json({
      success: true,
      cached: false,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

exports.getSystemMetrics = async (req, res, next) => {
  try {
    const cacheKey = 'system_metrics';
    
    // Try cache first (cache for 1 minute for system metrics)
    const cached = await redis.get(`analytics:${cacheKey}`);
    if (cached) {
      return res.json({
        success: true,
        cached: true,
        metrics: JSON.parse(cached)
      });
    }

    // Get system-wide metrics
    const totalUsers = await User.countDocuments();
    const totalDevices = await Device.countDocuments();
    const activeDevices = await Device.countDocuments({ status: 'active' });
    const totalLogs = await Log.countDocuments();

    // Get recent activity (last hour)
    const recentLogs = await Log.countDocuments({
      timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
    });

    const result = {
      users: {
        total: totalUsers
      },
      devices: {
        total: totalDevices,
        active: activeDevices,
        inactive: totalDevices - activeDevices
      },
      logs: {
        total: totalLogs,
        recentHour: recentLogs
      },
      generatedAt: new Date().toISOString()
    };

    // Cache for 1 minute
    await redis.setex(`analytics:${cacheKey}`, 60, JSON.stringify(result));

    res.json({
      success: true,
      cached: false,
      metrics: result
    });
  } catch (err) {
    next(err);
  }
};
