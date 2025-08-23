const Device = require('../models/Device');
const Log = require('../models/Log');
const User = require('../models/User');
const redis = require('../config/redis');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

// Export job statuses
const JOB_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Store export jobs in Redis with 24 hour TTL
const JOB_TTL = 24 * 60 * 60;

class ExportJob {
  constructor(id, userId, type, format, filters = {}) {
    this.id = id;
    this.userId = userId;
    this.type = type; // 'devices', 'logs', 'analytics'
    this.format = format; // 'json', 'csv'
    this.filters = filters;
    this.status = JOB_STATUS.PENDING;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.progress = 0;
    this.result = null;
    this.error = null;
  }

  async save() {
    const key = `export:${this.id}`;
    await redis.setex(key, JOB_TTL, JSON.stringify(this));
  }

  static async findById(id) {
    const key = `export:${id}`;
    const data = await redis.get(key);
    if (!data) return null;
    
    const parsed = JSON.parse(data);
    // Create a new ExportJob instance from the parsed data
    const job = new ExportJob(parsed.id, parsed.userId, parsed.type, parsed.format, parsed.filters);
    Object.assign(job, parsed);
    return job;
  }

  async update(updates) {
    Object.assign(this, updates);
    this.updatedAt = new Date();
    await this.save();
  }
}

// Process export jobs in background
async function processExportJob(jobId) {
  try {
    const job = await ExportJob.findById(jobId);
    if (!job) {
      console.error(`Export job ${jobId} not found`);
      return;
    }

    await job.update({ status: JOB_STATUS.PROCESSING, progress: 10 });

    let data;
    let filename;

    switch (job.type) {
      case 'devices':
        data = await exportDevices(job.userId, job.filters);
        filename = `devices_${job.userId}_${Date.now()}`;
        break;
      case 'logs':
        data = await exportLogs(job.userId, job.filters);
        filename = `logs_${job.userId}_${Date.now()}`;
        break;
      case 'analytics':
        data = await exportAnalytics(job.userId, job.filters);
        filename = `analytics_${job.userId}_${Date.now()}`;
        break;
      default:
        throw new Error(`Unknown export type: ${job.type}`);
    }

    await job.update({ progress: 50 });

    // Convert to requested format
    let exportData;
    let fileExtension;
    
    if (job.format === 'csv') {
      exportData = convertToCSV(data);
      fileExtension = 'csv';
    } else {
      exportData = JSON.stringify(data, null, 2);
      fileExtension = 'json';
    }

    await job.update({ progress: 80 });

    // Store the export file (in production, use cloud storage)
    const fullFilename = `${filename}.${fileExtension}`;
    const exportPath = path.join(__dirname, '../exports', fullFilename);
    
    // Ensure exports directory exists
    await fs.mkdir(path.dirname(exportPath), { recursive: true });
    await fs.writeFile(exportPath, exportData);

    await job.update({
      status: JOB_STATUS.COMPLETED,
      progress: 100,
      result: {
        filename: fullFilename,
        size: exportData.length,
        downloadUrl: `/exports/${fullFilename}` // In production, use cloud storage URL
      }
    });

    // Simulate email notification
    console.log(`[EXPORT] Export completed for user ${job.userId}: ${fullFilename}`);
    
    // In production, send actual email:
    // await sendExportNotification(job.userId, fullFilename);

  } catch (error) {
    console.error(`Export job ${jobId} failed:`, error);
    const job = await ExportJob.findById(jobId);
    if (job) {
      await job.update({
        status: JOB_STATUS.FAILED,
        error: error.message
      });
    }
  }
}

async function exportDevices(userId, filters = {}) {
  const query = { owner: userId };
  if (filters.type) query.type = filters.type;
  if (filters.status) query.status = filters.status;

  const devices = await Device.find(query).lean();
  
  return {
    exportType: 'devices',
    totalCount: devices.length,
    exportedAt: new Date().toISOString(),
    data: devices.map(device => ({
      id: device._id,
      name: device.name,
      type: device.type,
      status: device.status,
      lastActiveAt: device.last_active_at,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt
    }))
  };
}

async function exportLogs(userId, filters = {}) {
  const { deviceId, startDate, endDate, event } = filters;
  
  // Build query
  const deviceQuery = deviceId ? { _id: deviceId, owner: userId } : { owner: userId };
  const devices = await Device.find(deviceQuery).select('_id');
  const deviceIds = devices.map(d => d._id);

  const logQuery = { device: { $in: deviceIds } };
  if (startDate) logQuery.timestamp = { $gte: new Date(startDate) };
  if (endDate) {
    logQuery.timestamp = logQuery.timestamp || {};
    logQuery.timestamp.$lte = new Date(endDate);
  }
  if (event) logQuery.event = event;

  const logs = await Log.find(logQuery)
    .populate('device', 'name type')
    .sort({ timestamp: -1 })
    .lean();

  return {
    exportType: 'logs',
    totalCount: logs.length,
    exportedAt: new Date().toISOString(),
    filters: { deviceId, startDate, endDate, event },
    data: logs.map(log => ({
      id: log._id,
      deviceId: log.device._id,
      deviceName: log.device.name,
      deviceType: log.device.type,
      event: log.event,
      value: log.value,
      timestamp: log.timestamp
    }))
  };
}

async function exportAnalytics(userId, filters = {}) {
  const { startDate, endDate } = filters;
  
  // Build date filter
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  // Get device statistics
  const deviceStats = await Device.aggregate([
    { $match: { owner: userId, ...dateFilter } },
    {
      $group: {
        _id: null,
        totalDevices: { $sum: 1 },
        activeDevices: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        inactiveDevices: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } }
      }
    }
  ]);

  // Get usage statistics
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
        totalUnitsConsumed: { $sum: { $cond: [{ $eq: ['$event', 'units_consumed'] }, '$value', 0] } }
      }
    }
  ]);

  return {
    exportType: 'analytics',
    exportedAt: new Date().toISOString(),
    filters: { startDate, endDate },
    deviceStats: deviceStats[0] || {
      totalDevices: 0,
      activeDevices: 0,
      inactiveDevices: 0
    },
    usageStats: usageStats[0] || {
      totalLogs: 0,
      totalUnitsConsumed: 0
    }
  };
}

function convertToCSV(data) {
  if (!data.data || !Array.isArray(data.data)) {
    return 'No data to export';
  }

  if (data.data.length === 0) {
    return 'No records found';
  }

  const headers = Object.keys(data.data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data.data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

exports.enqueueExport = async (req, res, next) => {
  try {
    const { type, format = 'json', filters = {} } = req.body;
    const userId = req.user._id;

    // Validate export type
    const validTypes = ['devices', 'logs', 'analytics'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid export type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate format
    const validFormats = ['json', 'csv'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        message: `Invalid format. Must be one of: ${validFormats.join(', ')}`
      });
    }

    // Create export job
    const jobId = uuidv4();
    const job = new ExportJob(jobId, userId, type, format, filters);
    await job.save();

    // Process job in background (in production, use a job queue like Bull)
    setImmediate(() => processExportJob(jobId));

    res.json({
      success: true,
      message: 'Export job queued successfully',
      jobId,
      status: job.status
    });
  } catch (err) {
    next(err);
  }
};

exports.getStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const job = await ExportJob.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Export job not found'
      });
    }

    // Verify job ownership
    if (job.userId !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      job: {
        id: job.id,
        type: job.type,
        format: job.format,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        result: job.result,
        error: job.error
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.download = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const job = await ExportJob.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Export job not found'
      });
    }

    // Verify job ownership
    if (job.userId !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (job.status !== JOB_STATUS.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: `Export job is not ready. Status: ${job.status}`
      });
    }

    const filePath = path.join(__dirname, '../exports', job.result.filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Export file not found'
      });
    }

    // Set appropriate headers
    const contentType = job.format === 'csv' ? 'text/csv' : 'application/json';
    const disposition = `attachment; filename="${job.result.filename}"`;
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', disposition);
    
    // Stream the file
    const fileStream = require('fs').createReadStream(filePath);
    fileStream.pipe(res);

  } catch (err) {
    next(err);
  }
};

exports.listExports = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Get all export jobs for the user
    const pattern = `export:*`;
    const stream = redis.scanStream({ match: pattern, count: 100 });
    const jobs = [];

    return new Promise((resolve) => {
      stream.on('data', async (keys) => {
        for (const key of keys) {
          try {
            const jobData = await redis.get(key);
            if (jobData) {
              const job = JSON.parse(jobData);
              if (job.userId === userId) {
                jobs.push({
                  id: job.id,
                  type: job.type,
                  format: job.format,
                  status: job.status,
                  progress: job.progress,
                  createdAt: job.createdAt,
                  updatedAt: job.updatedAt
                });
              }
            }
          } catch (error) {
            console.error('Error parsing job data:', error);
          }
        }
      });

      stream.on('end', () => {
        // Sort by creation date (newest first)
        jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.json({
          success: true,
          exports: jobs
        });
        resolve();
      });
    });

  } catch (err) {
    next(err);
  }
};
