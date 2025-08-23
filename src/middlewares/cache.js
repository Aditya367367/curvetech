
const crypto = require('crypto');
const redis = require('../config/redis');

const b64url = (s) => Buffer.from(s).toString('base64url');
const stable = (obj) => b64url(JSON.stringify(obj || {}));


function cacheRoute({ prefix, ttlSec, keyBuilder }) {
  return async (req, res, next) => {
    try {
      const keySuffix = keyBuilder(req);
      const key = `${prefix}:${keySuffix}`;
      const hit = await redis.get(key);
      if (hit) {
        return res.json(JSON.parse(hit));
      }

      const original = res.json.bind(res);
      res.json = (body) => {
       
        Promise.resolve(redis.setex(key, ttlSec, JSON.stringify(body))).catch(() => {});
        return original(body);
      };

      next();
    } catch (e) {
     
      next();
    }
  };
}


const devicesListCache = (ttlSec = 15 * 60) =>
  cacheRoute({
    prefix: 'devices:list',
    ttlSec,
    keyBuilder: (req) => {
      
      const userId = req.user?._id?.toString?.() || req.user?.id || 'anon';
      const qhash = stable(req.query);
      return `${userId}:${qhash}`;
    }
  });

const deviceLogsCache = (ttlSec = 5 * 60) =>
  cacheRoute({
    prefix: 'logs:list',
    ttlSec,
    keyBuilder: (req) => {
      const deviceId = req.params.id;
      const qhash = stable({ limit: req.query.limit });
      return `${deviceId}:${qhash}`;
    }
  });

const deviceUsageCache = (ttlSec = 5 * 60) =>
  cacheRoute({
    prefix: 'usage:total',
    ttlSec,
    keyBuilder: (req) => {
      const deviceId = req.params.id;
      const qhash = stable({ range: req.query.range });
      return `${deviceId}:${qhash}`;
    }
  });


async function deleteByPattern(pattern) {
 
  const stream = redis.scanStream({ match: pattern, count: 500 });
  const keys = [];
  return new Promise((resolve) => {
    stream.on('data', (ks) => keys.push(...ks));
    stream.on('end', async () => {
      if (keys.length) await redis.del(...keys);
      resolve();
    });
  });
}

async function invalidateUserDeviceLists(userId) {
  const pattern = `devices:list:${userId}:*`;
  await deleteByPattern(pattern);
}


async function invalidateDeviceComputed(deviceId) {
  await Promise.all([
    deleteByPattern(`logs:list:${deviceId}:*`),
    deleteByPattern(`usage:total:${deviceId}:*`)
  ]);
}


async function invalidateAllDevices() {
  await Promise.all([
    deleteByPattern('devices:list:*'),
    deleteByPattern('logs:list:*'),
    deleteByPattern('usage:total:*'),
  ]);
}

module.exports = {
  devicesListCache,
  deviceLogsCache,
  deviceUsageCache,
  invalidateUserDeviceLists,
  invalidateDeviceComputed,
  invalidateAllDevices,
};
