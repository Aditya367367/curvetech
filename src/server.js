require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const startDeactivateJob = require('./jobs/deactivateDevices');

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  startDeactivateJob();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('DB connection failed:', err);
  process.exit(1);
});
