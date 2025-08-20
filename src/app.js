require('dotenv').config();
const express = require('express');
require('express-async-errors'); 
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/auth', authRoutes);
app.use('/devices', deviceRoutes);

app.use(errorHandler);

module.exports = app;
