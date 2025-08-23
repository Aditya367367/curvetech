
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET; 
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET; 
const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TTL = process.env.REFRESH_TOKEN_TTL || '7d';

function signWithJti(payload, secret, expiresIn) {
  const jti = uuidv4();
  const token = jwt.sign({ ...payload, jti }, secret, { expiresIn });
  const { exp } = jwt.decode(token);
  return { token, jti, exp };
}

function createAccessToken(user) {

  const payload = { sub: user._id.toString(), id: user._id.toString(), email: user.email, role: user.role, typ: 'access' };
  return signWithJti(payload, ACCESS_SECRET, ACCESS_TTL);
}

function createRefreshToken(user) {
  const payload = { sub: user._id.toString(), typ: 'refresh', role: user.role };
  return signWithJti(payload, REFRESH_SECRET, REFRESH_TTL);
}

function verifyAccess(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

function verifyRefresh(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

module.exports = {
  createAccessToken,
  createRefreshToken,
  verifyAccess,
  verifyRefresh,
};
