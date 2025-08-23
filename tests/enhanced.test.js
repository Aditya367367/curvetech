const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const connectDB = require('../src/config/db');
const redis = require('../src/config/redis');

let mongoServer;
let token, deviceId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  await connectDB();

  // Create test user and login
  const user = { name: 'Enhanced', email: 'enhanced@test.com', password: 'password123' };
  await request(app).post('/auth/signup').send(user);
  const res = await request(app).post('/auth/login').send({ email: user.email, password: user.password });
  token = res.body.token;

  // Create test device
  const deviceRes = await request(app)
    .post('/devices')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'EnhancedDevice', type: 'light', status: 'active' });
  deviceId = deviceRes.body.device._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  if (redis.quit) {
    await redis.quit();
  }
});

describe('Enhanced Features', () => {
  describe('Health Check & Metrics', () => {
    test('health check endpoint', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('healthy');
      expect(res.body.checks).toBeDefined();
    });

    test('metrics endpoint', async () => {
      const res = await request(app).get('/health/metrics');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.metrics).toBeDefined();
      expect(res.body.metrics.system).toBeDefined();
      expect(res.body.metrics.requests).toBeDefined();
    });

    test('system info endpoint', async () => {
      const res = await request(app).get('/health/system');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.system).toBeDefined();
      expect(res.body.system.platform).toBeDefined();
      expect(res.body.system.nodeVersion).toBeDefined();
    });
  });

  describe('Enhanced Analytics', () => {
    test('analytics summary with caching', async () => {
      
      const res1 = await request(app)
        .get('/analytics/summary')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res1.statusCode).toBe(200);
      expect(res1.body.success).toBe(true);
      expect(res1.body.cached).toBe(false);
      expect(res1.body.deviceStats).toBeDefined();

      // Second request - should be cached
      const res2 = await request(app)
        .get('/analytics/summary')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res2.statusCode).toBe(200);
      expect(res2.body.success).toBe(true);
      expect(res2.body.cached).toBe(true);
    });

    test('device-specific analytics', async () => {
      const res = await request(app)
        .get(`/analytics/devices/${deviceId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.device).toBeDefined();
      expect(res.body.logs).toBeDefined();
    });

    test('system metrics', async () => {
      const res = await request(app)
        .get('/analytics/system')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.metrics).toBeDefined();
      expect(res.body.metrics.users).toBeDefined();
      expect(res.body.metrics.devices).toBeDefined();
    });

    test('analytics endpoint performance', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .get('/analytics/summary')
            .set('Authorization', `Bearer ${token}`)
        );
      }
      
      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      const successful = responses.filter(res => res.statusCode === 200);
      expect(successful.length).toBeGreaterThan(3); // At least 60% success rate
      expect(totalTime).toBeLessThan(3000); // Should complete within 3 seconds
    });
  });

  describe('Data Export', () => {
    test('enqueue device export', async () => {
      const res = await request(app)
        .post('/export')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'devices',
          format: 'json'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.jobId).toBeDefined();
      expect(res.body.status).toBe('pending');
    });

    test('enqueue logs export with filters', async () => {
      const res = await request(app)
        .post('/export')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'logs',
          format: 'csv',
          filters: {
            deviceId: deviceId,
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString()
          }
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.jobId).toBeDefined();
    });

    test('list export jobs', async () => {
      const res = await request(app)
        .get('/export')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.exports).toBeDefined();
      expect(Array.isArray(res.body.exports)).toBe(true);
    });

    test('get export job status', async () => {
      // First create an export job
      const createRes = await request(app)
        .post('/export')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'analytics',
          format: 'json'
        });
      
      const jobId = createRes.body.jobId;
      
      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check status
      const res = await request(app)
        .get(`/export/${jobId}/status`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.job).toBeDefined();
      expect(res.body.job.id).toBe(jobId);
    });
  });

  describe('Enhanced Caching', () => {
    test('device listing with cache', async () => {
      // First request
      const res1 = await request(app)
        .get('/devices')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res1.statusCode).toBe(200);
      expect(res1.body.success).toBe(true);

      // Second request should be faster (cached)
      const startTime = Date.now();
      const res2 = await request(app)
        .get('/devices')
        .set('Authorization', `Bearer ${token}`);
      const responseTime = Date.now() - startTime;
      
      expect(res2.statusCode).toBe(200);
      expect(res2.body.success).toBe(true);
      expect(responseTime).toBeLessThan(500); // Should be under 500ms for cached response (test environment)
    });

    test('device logs with cache', async () => {
      // Create some logs first
      await request(app)
        .post(`/devices/${deviceId}/logs`)
        .set('Authorization', `Bearer ${token}`)
        .send({ event: 'units_consumed', value: 10 });

      // First request
      const res1 = await request(app)
        .get(`/devices/${deviceId}/logs`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res1.statusCode).toBe(200);
      expect(res1.body.success).toBe(true);

      // Second request should be cached
      const res2 = await request(app)
        .get(`/devices/${deviceId}/logs`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res2.statusCode).toBe(200);
      expect(res2.body.success).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    test('auth rate limiting', async () => {
      // Try to login multiple times quickly
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/auth/login')
            .send({ email: 'test@example.com', password: 'wrongpassword' })
        );
      }
      
      const responses = await Promise.all(promises);
      const rateLimited = responses.filter(res => res.statusCode === 429);
      
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    test('analytics rate limiting', async () => {
      // Make multiple analytics requests to trigger rate limiting
      const promises = [];
      for (let i = 0; i < 120; i++) {
        promises.push(
          request(app)
            .get('/analytics/summary')
            .set('Authorization', `Bearer ${token}`)
        );
      }
      
      const responses = await Promise.all(promises);
      const rateLimited = responses.filter(res => res.statusCode === 429);
      
      expect(rateLimited.length).toBeGreaterThan(0);
    }, 15000); // Increase timeout to 15 seconds
  });

  describe('Enhanced Error Handling', () => {
    test('structured error responses', async () => {
      const res = await request(app)
        .get('/devices/invalid-id')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.path).toBeDefined();
    });

    test('404 handler', async () => {
      const res = await request(app).get('/nonexistent-endpoint');
      
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('NOT_FOUND');
    });
  });

  describe('Real-time Features', () => {
    test('SSE endpoint', async () => {
      // Test that SSE endpoint exists and requires auth
      const unauthedRes = await request(app)
        .get('/realtime/stream');
      expect(unauthedRes.statusCode).toBe(401);
      
      // Test that authenticated access works (will immediately get headers)
      return new Promise((resolve) => {
        const req = request(app)
          .get('/realtime/stream')
          .set('Authorization', `Bearer ${token}`)
          .timeout(500);
        
        req.on('response', (res) => {
          expect(res.statusCode).toBe(200);
          expect(res.headers['content-type']).toContain('text/event-stream');
          req.abort(); // Close the connection
          resolve();
        });
        
        req.on('error', () => {
          // Timeout or abort is expected for SSE
          resolve();
        });
        
        req.end();
      });
    }, 3000);

    test('device heartbeat with real-time updates', async () => {
      const res = await request(app)
        .post(`/devices/${deviceId}/heartbeat`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'active',
          metrics: {
            battery: 85,
            temperature: 25,
            signalStrength: 90
          }
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.last_active_at).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    test('concurrent device requests', async () => {
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          request(app)
            .get('/devices')
            .set('Authorization', `Bearer ${token}`)
        );
      }
      
      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      const successful = responses.filter(res => res.statusCode === 200);
      expect(successful.length).toBeGreaterThan(40); 
      expect(totalTime).toBeLessThan(5000); 
    });
  });
});
