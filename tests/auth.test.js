const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const connectDB = require('../src/config/db');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  await connectDB();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test('signup -> login flow', async () => {
  const user = { name: 'Test', email: 't@test.com', password: 'password123' };

  const sign = await request(app).post('/auth/signup').send(user);
  expect(sign.statusCode).toBe(200);
  expect(sign.body.success).toBe(true);

  const login = await request(app).post('/auth/login').send({ email: user.email, password: user.password });
  expect(login.statusCode).toBe(200);
  expect(login.body.token).toBeDefined();
});
