
const redis = require('../config/redis');

const PREFIX = 'cache';

const norm = (v) => (v === undefined || v === null || v === '' ? 'any' : String(v));

function devicesListKey(req) {
  const userId = req.user?._id?.toString?.() || req.user?.id || 'anon';
  const type = norm(req.query.type);
  const status = norm(req.query.status);
  return `${PREFIX}:devices:list:user:${userId}:type=${type}:status=${status}`;
}

function deviceLogsKey(req) {
  const userId = req.user?._id?.toString?.() || req.user?.id || 'anon';
  const id = req.params.id;
  const limit = norm(req.query.limit || 10);
  return `${PREFIX}:devices:logs:user:${userId}:device:${id}:limit=${limit}`;
}

function deviceUsageKey(req) {
  const userId = req.user?._id?.toString?.() || req.user?.id || 'anon';
  const id = req.params.id;
  const range = norm(req.query.range || '24h');
  return `${PREFIX}:devices:usage:user:${userId}:device:${id}:range=${range}`;
}

async function deleteByPattern(pattern) {
  return new Promise((resolve, reject) => {
    const stream = redis.scanStream({ match: pattern, count: 100 });
    const keys = [];
    stream.on('data', (resultKeys) => keys.push(...resultKeys));
    stream.on('end', async () => {
      if (!keys.length) return resolve(0);
      try {
        const chunkSize = 100;
        for (let i = 0; i < keys.length; i += chunkSize) {
          const chunk = keys.slice(i, i + chunkSize);
          await redis.del(chunk);
        }
        resolve(keys.length);
      } catch (e) {
        
        console.warn('[Redis] deleteByPattern error', e);
        resolve(0);
      }
    });
    stream.on('error', (e) => {
      console.warn('[Redis] scanStream error', e);
      resolve(0);
    });
  });
}

async function invalidateUserDeviceLists(userId) {
  const uid = userId?.toString?.() || userId;
  return deleteByPattern(`${PREFIX}:devices:list:user:${uid}:*`);
}

async function invalidateDeviceAnalytics(userId, deviceId) {
  const uid = userId?.toString?.() || userId;
  await deleteByPattern(`${PREFIX}:devices:logs:user:${uid}:device:${deviceId}:*`);
  await deleteByPattern(`${PREFIX}:devices:usage:user:${uid}:device:${deviceId}:*`);
}

module.exports = {
  devicesListKey,
  deviceLogsKey,
  deviceUsageKey,
  invalidateUserDeviceLists,
  invalidateDeviceAnalytics,
  deleteByPattern,
};
