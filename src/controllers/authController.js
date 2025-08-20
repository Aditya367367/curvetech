const Joi = require('joi');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch(err) { next(err); }
};
