
const redis = require('../config/redis');


async function blacklistJti(jti, exp) {
  if (!jti || !exp) return;
  const ttlSec = Math.max(1, exp - Math.floor(Date.now() / 1000));
  await redis.set(`bl:${jti}`, '1', 'EX', ttlSec);
}

async function isBlacklisted(jti) {
  if (!jti) return false;
  const v = await redis.get(`bl:${jti}`);
  return Boolean(v);
}


async function setUserRefreshJti(userId, jti, ttlSeconds) {
  await redis.set(`rt:${userId}`, jti, 'EX', ttlSeconds);
}

async function getUserRefreshJti(userId) {
  return redis.get(`rt:${userId}`);
}

module.exports = {
  blacklistJti,
  isBlacklisted,
  setUserRefreshJti,
  getUserRefreshJti,
};
