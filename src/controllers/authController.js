
const Joi = require('joi');
const jwt = require('jsonwebtoken'); 
const User = require('../models/User');
const {
  createAccessToken,
  createRefreshToken,
  verifyRefresh,
} = require('../services/tokenService');
const {
  blacklistJti,
  setUserRefreshJti,
  getUserRefreshJti,
} = require('../services/tokenStore');

const signupSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('user','admin').default('user')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

exports.signup = async (req, res, next) => {
  try {
    const { error, value } = signupSchema.validate(req.body);
    if(error) return res.status(400).json({ success:false, message: error.details[0].message });

    const exists = await User.findOne({ email: value.email });
    if(exists) return res.status(400).json({ success:false, message: 'Email already registered' });

    const user = new User(value);
    await user.save();
    res.json({ success: true, message: 'User registered successfully' });
  } catch(err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if(error) return res.status(400).json({ success:false, message: error.details[0].message });

    const user = await User.findOne({ email: value.email });
    if(!user) return res.status(400).json({ success:false, message: 'Invalid credentials' });

    const match = await user.comparePassword(value.password);
    if(!match) return res.status(400).json({ success:false, message: 'Invalid credentials' });

    const access = createAccessToken(user);
    const refresh = createRefreshToken(user);

    const ttlSec = Math.max(60, Math.floor(refresh.exp - Math.floor(Date.now() / 1000)));
    await setUserRefreshJti(user._id.toString(), refresh.jti, ttlSec);

    
    res.json({
      success: true,
      token: access.token, 
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      access_token: access.token,
      access_expires_at: access.exp,
      refresh_token: refresh.token,
      refresh_expires_at: refresh.exp
    });
  } catch(err) { next(err); }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refresh_token } = req.body || {};
    if (!refresh_token) return res.status(400).json({ success:false, message:'refresh_token required' });

    const payload = verifyRefresh(refresh_token); 
    if (payload.typ !== 'refresh') return res.status(400).json({ success:false, message: 'Invalid refresh' });

   
    const lastJti = await getUserRefreshJti(payload.sub);
    if (!lastJti || lastJti !== payload.jti) {
      return res.status(401).json({ success:false, message:'refresh token reused or revoked' });
    }

    
    await blacklistJti(payload.jti, payload.exp);

    
    const fakeUser = { _id: payload.sub, role: payload.role || 'user', email: '' };
    const access = createAccessToken(fakeUser);
    const refresh = createRefreshToken(fakeUser);

    const ttlSec = Math.max(60, refresh.exp - Math.floor(Date.now() / 1000));
    await setUserRefreshJti(payload.sub, refresh.jti, ttlSec);

    res.json({
      success: true,
      access_token: access.token,
      access_expires_at: access.exp,
      refresh_token: refresh.token,
      refresh_expires_at: refresh.exp
    });
  } catch (err) {
    return res.status(401).json({ success:false, message:'Invalid refresh token' });
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { refresh_token } = req.body || {};
    if (!refresh_token) return res.status(400).json({ success:false, message:'refresh_token required' });
    
    try {
      const decoded = require('../services/tokenService').verifyRefresh(refresh_token);
      await blacklistJti(decoded.jti, decoded.exp);
    } catch {}
    res.json({ success: true });
  } catch (err) { next(err); }
};
