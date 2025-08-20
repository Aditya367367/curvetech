const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const connectDB = require('../src/config/db');

let mongoServer, token, deviceId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  await connectDB();
  await request(app).post('/auth/signup').send({ name: 'Log', email: 'log@test.com', password: 'password123' });
  const res = await request(app).post('/auth/login').send({ email: 'log@test.com', password: 'password123' });
  token = res.body.token;
  const device = await request(app)
    .post('/devices')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'LogDevice', type: 'fan', status: 'active' });
  deviceId = device.body.device._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test('create and get logs', async () => {
  await request(app)
    .post(`/devices/${deviceId}/logs`)
    .set('Authorization', `Bearer ${token}`)
    .send({ event: 'units_consumed', value: 5 });

  const res = await request(app)
    .get(`/devices/${deviceId}/logs`)
    .set('Authorization', `Bearer ${token}`);

  expect(res.statusCode).toBe(200);
  expect(res.body.logs.length).toBeGreaterThan(0);
});

test('get usage for last 24h', async () => {
  const res = await request(app)
    .get(`/devices/${deviceId}/usage`)
    .set('Authorization', `Bearer ${token}`);
  expect(res.statusCode).toBe(200);
  expect(res.body.total_units_last_24h).toBeGreaterThanOrEqual(0);
});

test('unauthorized log access', async () => {
  const res = await request(app)
    .get(`/devices/${deviceId}/logs`);
  expect(res.statusCode).toBe(401);
});