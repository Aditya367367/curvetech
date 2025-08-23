require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const startDeactivateJob = require('./jobs/deactivateDevices');
const { initSocket } = require('./realtime/socket');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_ACCESS_SECRET;

connectDB().then(() => {
  startDeactivateJob();

  const server = http.createServer(app);


  const io = initSocket(server, JWT_SECRET);
  app.set('io', io);

  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('DB connection failed:', err);
  process.exit(1);
});
