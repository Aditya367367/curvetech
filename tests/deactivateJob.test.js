const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Device = require('../src/models/Device');
const User = require('../src/models/User');
const connectDB = require('../src/config/db');
const { deactivateInactiveDevices } = require('../src/jobs/deactivateDevices');

let mongoServer, user;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  await connectDB();
  user = await User.create({ name: 'Job', email: 'job@test.com', password: 'password123' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test('auto-deactivate device after 24h', async () => {
  const device = await Device.create({
    name: 'Old Device',
    type: 'light',
    status: 'active',
    last_active_at: new Date(Date.now() - 25 * 60 * 60 * 1000),
    owner: user._id
  });

  await deactivateInactiveDevices(); 

  const updated = await Device.findById(device._id);
  expect(updated.status).toBe('inactive');
});