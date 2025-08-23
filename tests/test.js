const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const connectDB = require('../src/config/db');
const Device = require('../src/models/Device');
const User = require('../src/models/User');
const { deactivateInactiveDevices } = require('../src/jobs/deactivateDevices');

let mongoServer;
let token, deviceId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  await connectDB();

  // Seed test user
  const user = { name: 'Master', email: 'master@test.com', password: 'password123' };
  await request(app).post('/auth/signup').send(user);
  const res = await request(app).post('/auth/login').send({ email: user.email, password: user.password });
  token = res.body.token;

  // Create one test device
  const deviceRes = await request(app)
    .post('/devices')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'MasterDevice', type: 'light', status: 'active' });
  deviceId = deviceRes.body.device._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

//
// AUTH TESTS
//
describe('Auth flow', () => {
  test('signup -> login works', async () => {
    const user = { name: 'Flow', email: 'flow@test.com', password: 'password123' };
    const sign = await request(app).post('/auth/signup').send(user);
    expect(sign.statusCode).toBe(200);
    const login = await request(app).post('/auth/login').send({ email: user.email, password: user.password });
    expect(login.statusCode).toBe(200);
    expect(login.body.token).toBeDefined();
  });

  test('duplicate email rejected', async () => {
    const res = await request(app).post('/auth/signup').send({ name: 'Dup', email: 'master@test.com', password: '123456' });
    expect(res.statusCode).toBe(400);
  });
});

//
// DEVICE TESTS
//
describe('Device CRUD + filters', () => {
  test('get all devices', async () => {
    const res = await request(app)
      .get('/devices')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.devices.length).toBeGreaterThan(0);
  });

  test('filter by type=light', async () => {
    const res = await request(app)
      .get('/devices?type=light')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.devices[0].type).toBe('light');
  });

  test('unauthorized access blocked', async () => {
    const res = await request(app).get('/devices');
    expect(res.statusCode).toBe(401);
  });
});

//
// LOG TESTS
//
describe('Logs + Usage', () => {
  test('create and retrieve logs', async () => {
    await request(app)
      .post(`/devices/${deviceId}/logs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ event: 'units_consumed', value: 10 });

    const res = await request(app)
      .get(`/devices/${deviceId}/logs`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.logs.length).toBeGreaterThan(0);
  });

  test('get usage last 24h', async () => {
    const res = await request(app)
      .get(`/devices/${deviceId}/usage`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.total_units_last_24h).toBeGreaterThanOrEqual(0);
  });
});

//
// JOB TESTS
//
describe('Background jobs', () => {
  test('deactivates stale devices', async () => {
    const user = await User.findOne({ email: 'master@test.com' });
    const oldDevice = await Device.create({
      name: 'Old Device',
      type: 'fan',
      status: 'active',
      last_active_at: new Date(Date.now() - 25 * 60 * 60 * 1000),
      owner: user._id
    });

    await deactivateInactiveDevices();
    const updated = await Device.findById(oldDevice._id);
    expect(updated.status).toBe('inactive');
  });
});

//
// RATE LIMIT TEST
//
describe('Rate limiting', () => {
  test('too many requests returns 429', async () => {
    let lastRes;
    for (let i = 0; i < 101; i++) {
      lastRes = await request(app)
        .get('/devices')
        .set('Authorization', `Bearer ${token}`);
    }
    expect(lastRes.statusCode).toBe(429);
    expect(lastRes.body.message).toMatch(/Too many requests/i);
  }, 20000);
});
