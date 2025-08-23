
const IORedis = require('ioredis');

const url = process.env.REDIS_URL || 'redis://localhost:6379';
const isTest = process.env.NODE_ENV === 'test';

let redis;


if (isTest) {
  const store = new Map();
  redis = {
    get: async (k) => store.get(k) || null,
    set: async (k, v) => { store.set(k, v); },
    setex: async (k, ttl, v) => { store.set(k, v); },
    del: async (...keys) => { keys.forEach(k => store.delete(k)); },
    flushall: async () => { store.clear(); },
    ping: async () => 'PONG', // Add ping method for health checks
    scanStream: () => {
      const keys = Array.from(store.keys());
      let emitted = false;
      return {
        on: (evt, cb) => {
          if (evt === 'data' && !emitted) { emitted = true; cb(keys); }
          if (evt === 'end') { setTimeout(cb, 0); }
        }
      };
    }
  };
} else {
  redis = new IORedis(url);
  redis.on('connect', () => console.log('[Cache] Redis connected'));
  redis.on('error', (e) => console.error('[Cache] Redis error', e?.message));
}

module.exports = redis;
