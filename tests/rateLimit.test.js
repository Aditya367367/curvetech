const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const connectDB = require('../src/config/db');

let mongoServer, token;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  await connectDB();
  await request(app).post('/auth/signup').send({ name: 'Rate', email: 'rate@test.com', password: 'password123' });
  const res = await request(app).post('/auth/login').send({ email: 'rate@test.com', password: 'password123' });
  token = res.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test('rate limiting: 101 requests returns 429', async () => {
  let lastRes;
  for (let i = 0; i < 101; i++) {
    lastRes = await request(app)
      .get('/devices')
      .set('Authorization', `Bearer ${token}`);
  }
  expect(lastRes.statusCode).toBe(429);
  expect(lastRes.body.message).toMatch(/Too many requests/i);
}, 20000); 