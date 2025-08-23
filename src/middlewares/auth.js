const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyAccess } = require('../services/tokenService');
const { isBlacklisted } = require('../services/tokenStore');

module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization token missing' });
  }

  const token = header.split(' ')[1];

  try {
    let decoded; 

    try {
      
      decoded = verifyAccess(token);
    } catch (e) {
     
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    }

    
    if (decoded?.jti && await isBlacklisted(decoded.jti)) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const userId = decoded.sub || decoded.id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};
