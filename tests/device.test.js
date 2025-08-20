const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');

let mongoServer;
let token;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  await connectDB();

  // Create test user + login
  const user = { name: 'Tester', email: 'tester@example.com', password: 'password123' };
  await request(app).post('/auth/signup').send(user);

  const res = await request(app).post('/auth/login').send({ email: user.email, password: user.password });
  token = res.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Device Endpoints', () => {
  let lightId, fanId;

  test('Create devices', async () => {
    const light = await request(app)
      .post('/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Living Room Light', type: 'light', status: 'active' });

    expect(light.statusCode).toBe(200);
    expect(light.body.success).toBe(true);
    lightId = light.body.device._id;

    const fan = await request(app)
      .post('/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bedroom Fan', type: 'fan', status: 'inactive' });

    expect(fan.statusCode).toBe(200);
    fanId = fan.body.device._id;
  });

  test('Get all devices', async () => {
    const res = await request(app)
      .get('/devices')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.devices.length).toBe(2);
  });

  test('Filter by type=light', async () => {
    const res = await request(app)
      .get('/devices?type=light')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.devices.length).toBe(1);
    expect(res.body.devices[0].type).toBe('light');
  });

  test('Filter by status=inactive', async () => {
    const res = await request(app)
      .get('/devices?status=inactive')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.devices.length).toBe(1);
    expect(res.body.devices[0].status).toBe('inactive');
  });

  test('Filter by type=light&status=active', async () => {
    const res = await request(app)
      .get('/devices?type=light&status=active')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.devices.length).toBe(1);
    expect(res.body.devices[0].name).toBe('Living Room Light');
  });
});
