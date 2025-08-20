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
  await request(app).post('/auth/signup').send({ name: 'Edge', email: 'edge@test.com', password: 'password123' });
  const res = await request(app).post('/auth/login').send({ email: 'edge@test.com', password: 'password123' });
  token = res.body.token;
  const device = await request(app)
    .post('/devices')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'EdgeDevice', type: 'fan', status: 'active' });
  deviceId = device.body.device._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Auth edge cases', () => {
  test('signup missing fields', async () => {
    const res = await request(app).post('/auth/signup').send({ email: 'a@b.com' });
    expect(res.statusCode).toBe(400);
  });
  test('signup duplicate email', async () => {
    const res = await request(app).post('/auth/signup').send({ name: 'Edge', email: 'edge@test.com', password: 'password123' });
    expect(res.statusCode).toBe(400);
  });
  test('login wrong password', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'edge@test.com', password: 'wrongpass' });
    expect(res.statusCode).toBe(400);
  });
  test('login unregistered email', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'not@found.com', password: 'password123' });
    expect(res.statusCode).toBe(400);
  });
});

describe('Device edge cases', () => {
  test('create device missing fields', async () => {
    const res = await request(app)
      .post('/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' });
    expect(res.statusCode).toBe(400);
  });
  test('get device unauthorized', async () => {
    const res = await request(app).get(`/devices/${deviceId}`);
    expect(res.statusCode).toBe(401);
  });
  test('get device forbidden', async () => {
    await request(app).post('/auth/signup').send({ name: 'Other', email: 'other@test.com', password: 'password123' });
    const res2 = await request(app).post('/auth/login').send({ email: 'other@test.com', password: 'password123' });
    const otherToken = res2.body.token;
    const res = await request(app)
      .get(`/devices/${deviceId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.statusCode).toBe(403);
  });
  test('get device not found', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/devices/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });
});

describe('Log edge cases', () => {
  test('create log missing event', async () => {
    const res = await request(app)
      .post(`/devices/${deviceId}/logs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ value: 5 });
    expect(res.statusCode).toBe(400);
  });
  test('get logs unauthorized', async () => {
    const res = await request(app)
      .get(`/devices/${deviceId}/logs`);
    expect(res.statusCode).toBe(401);
  });
  test('get logs forbidden', async () => {
    const res2 = await request(app).post('/auth/login').send({ email: 'other@test.com', password: 'password123' });
    const otherToken = res2.body.token;
    const res = await request(app)
      .get(`/devices/${deviceId}/logs`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.statusCode).toBe(403);
  });
  test('get logs not found', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/devices/${fakeId}/logs`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });
});