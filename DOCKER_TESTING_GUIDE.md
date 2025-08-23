# 🐳 Docker Testing Guide - Smart Device Management Backend

This guide provides step-by-step instructions for testing the Smart Device Management Backend using Docker Compose.

## 🚀 Quick Start with Docker

### 1. Start the Application Stack

```bash
# Build and start all services
docker-compose up --build -d

# Check if all services are running
docker-compose ps

# View logs
docker-compose logs -f app
```

### 2. Verify Services are Running

```bash
# Check MongoDB
docker-compose exec mongo mongosh --eval "db.runCommand('ping')"

# Check Redis
docker-compose exec redis redis-cli ping

# Check Application Health
curl http://localhost:3000/health
```

## 📋 Testing Endpoints with cURL

### Step 1: Health & Monitoring Tests

#### 1.1 Health Check
```bash
curl -X GET http://localhost:3000/health
```

**Expected Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "dependencies": {
    "database": "connected",
    "redis": "connected"
  }
}
```

#### 1.2 System Metrics
```bash
curl -X GET http://localhost:3000/health/metrics
```

#### 1.3 System Information
```bash
curl -X GET http://localhost:3000/health/system
```

### Step 2: Authentication Tests

#### 2.1 User Registration
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "user"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully"
}
```

#### 2.2 User Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "access_expires_at": 1704067200,
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_expires_at": 1704672000
}
```

**Save the token for subsequent requests:**
```bash
# Save token to variable (replace with actual token from response)
export ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export REFRESH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 2.3 Refresh Token
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{
    \"refresh_token\": \"$REFRESH_TOKEN\"
  }"
```

### Step 3: Device Management Tests

#### 3.1 Get All Devices (Empty)
```bash
curl -X GET http://localhost:3000/devices \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "devices": []
}
```

#### 3.2 Create Device
```bash
curl -X POST http://localhost:3000/devices \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Living Room Light",
    "type": "light",
    "status": "active"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "device": {
    "_id": "device-id",
    "name": "Living Room Light",
    "type": "light",
    "status": "active",
    "owner": "user-id"
  }
}
```

**Save the device ID:**
```bash
# Save device ID to variable (replace with actual ID from response)
export DEVICE_ID="device-id"
```

#### 3.3 Get Device by ID
```bash
curl -X GET http://localhost:3000/devices/$DEVICE_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### 3.4 Update Device
```bash
curl -X PATCH http://localhost:3000/devices/$DEVICE_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Living Room Light",
    "status": "inactive"
  }'
```

#### 3.5 Device Heartbeat
```bash
curl -X POST http://localhost:3000/devices/$DEVICE_ID/heartbeat \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active",
    "metrics": {
      "battery": 85,
      "temperature": 25,
      "signalStrength": 90
    }
  }'
```

### Step 4: Device Logs & Usage Tests

#### 4.1 Create Log Entry
```bash
curl -X POST http://localhost:3000/devices/$DEVICE_ID/logs \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "units_consumed",
    "value": 10
  }'
```

#### 4.2 Get Device Logs
```bash
curl -X GET "http://localhost:3000/devices/$DEVICE_ID/logs?limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### 4.3 Get Device Usage
```bash
curl -X GET "http://localhost:3000/devices/$DEVICE_ID/usage?range=24h" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Step 5: Analytics Tests

#### 5.1 Analytics Summary
```bash
curl -X GET "http://localhost:3000/analytics/summary?start=2024-01-01&end=2024-01-31" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### 5.2 Device Analytics
```bash
curl -X GET "http://localhost:3000/analytics/devices/$DEVICE_ID?start=2024-01-01&end=2024-01-31" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### 5.3 System Metrics
```bash
curl -X GET http://localhost:3000/analytics/system \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Step 6: Data Export Tests

#### 6.1 Enqueue Device Export
```bash
curl -X POST http://localhost:3000/export \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "devices",
    "format": "json",
    "filters": {
      "status": "active"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "jobId": "export-job-id",
  "message": "Export job queued successfully"
}
```

**Save the job ID:**
```bash
# Save job ID to variable (replace with actual ID from response)
export EXPORT_JOB_ID="export-job-id"
```

#### 6.2 Enqueue Logs Export
```bash
curl -X POST http://localhost:3000/export \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "logs",
    "format": "csv",
    "filters": {
      "deviceId": "'$DEVICE_ID'",
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-01-31T23:59:59Z",
      "event": "units_consumed"
    }
  }'
```

#### 6.3 List Export Jobs
```bash
curl -X GET http://localhost:3000/export \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### 6.4 Check Export Status
```bash
curl -X GET http://localhost:3000/export/$EXPORT_JOB_ID/status \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### 6.5 Download Export
```bash
curl -X GET http://localhost:3000/export/$EXPORT_JOB_ID/download \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -o export_file.json
```

### Step 7: Real-time Communication Tests

#### 7.1 SSE Stream
```bash
curl -X GET http://localhost:3000/realtime/stream \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Accept: text/event-stream"
```

### Step 8: Cleanup Tests

#### 8.1 Delete Device
```bash
curl -X DELETE http://localhost:3000/devices/$DEVICE_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### 8.2 Logout
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"refresh_token\": \"$REFRESH_TOKEN\"
  }"
```

## 🔧 Docker Commands

### Useful Docker Commands

```bash
# View all running containers
docker-compose ps

# View logs for specific service
docker-compose logs app
docker-compose logs mongo
docker-compose logs redis

# Follow logs in real-time
docker-compose logs -f app

# Execute commands inside containers
docker-compose exec app sh
docker-compose exec mongo mongosh
docker-compose exec redis redis-cli

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild and restart
docker-compose up --build -d

# View resource usage
docker stats
```

### Database Access

```bash
# Access MongoDB
docker-compose exec mongo mongosh smart-devices

# Access Redis
docker-compose exec redis redis-cli

# List Redis keys
docker-compose exec redis redis-cli keys "*"

# Clear Redis cache
docker-compose exec redis redis-cli flushall
```

## 📊 Performance Testing

### Load Testing with Apache Bench

```bash
# Test health endpoint
ab -n 100 -c 10 http://localhost:3000/health

# Test device listing (with authentication)
ab -n 100 -c 10 -H "Authorization: Bearer $ACCESS_TOKEN" http://localhost:3000/devices

# Test analytics endpoint
ab -n 50 -c 5 -H "Authorization: Bearer $ACCESS_TOKEN" "http://localhost:3000/analytics/summary?start=2024-01-01&end=2024-01-31"
```

### Concurrent Testing Script

Create a file `concurrent_test.sh`:

```bash
#!/bin/bash

# Test concurrent device creation
for i in {1..10}; do
  curl -X POST http://localhost:3000/devices \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"Device $i\",
      \"type\": \"light\",
      \"status\": \"active\"
    }" &
done
wait

echo "Concurrent device creation completed"
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using port 3000
   lsof -i :3000
   
   # Kill the process
   kill -9 <PID>
   ```

2. **Container Won't Start**
   ```bash
   # Check container logs
   docker-compose logs app
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

3. **Database Connection Issues**
   ```bash
   # Check if MongoDB is running
   docker-compose exec mongo mongosh --eval "db.runCommand('ping')"
   
   # Check if Redis is running
   docker-compose exec redis redis-cli ping
   ```

4. **Permission Issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER ./src/exports
   ```

### Reset Everything

```bash
# Stop all containers and remove volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Rebuild from scratch
docker-compose up --build -d
```

## 📝 Test Report Template

After completing all tests, document your results:

```markdown
## Docker Test Report - [Date]

### Environment
- Docker Compose: Running
- MongoDB: Connected
- Redis: Connected
- Application: Healthy

### Test Results
- [ ] Health & Monitoring: X/X tests passed
- [ ] Authentication: X/X tests passed
- [ ] Device Management: X/X tests passed
- [ ] Device Logs & Usage: X/X tests passed
- [ ] Analytics: X/X tests passed
- [ ] Data Export: X/X tests passed
- [ ] Real-time Communication: X/X tests passed

### Performance Results
- Health check response time: X ms
- Device creation response time: X ms
- Analytics query response time: X ms
- Export job creation time: X ms

### Issues Found
- [List any issues encountered]

### Recommendations
- [Any suggestions for improvement]
```

## 🎯 Quick Test Script

Create a file `quick_test.sh` for automated testing:

```bash
#!/bin/bash

echo "🚀 Starting Smart Device Management Backend Tests..."

# Start services
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Test health
echo "🏥 Testing health endpoint..."
curl -s http://localhost:3000/health | jq '.'

# Test registration
echo "👤 Testing user registration..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","role":"user"}')
echo $REGISTER_RESPONSE | jq '.'

# Test login
echo "🔐 Testing user login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')
echo $LOGIN_RESPONSE | jq '.'

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
echo "✅ Token extracted: ${TOKEN:0:20}..."

# Test device creation
echo "📱 Testing device creation..."
DEVICE_RESPONSE=$(curl -s -X POST http://localhost:3000/devices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Device","type":"light","status":"active"}')
echo $DEVICE_RESPONSE | jq '.'

echo "✅ Quick test completed!"
```

Make it executable and run:
```bash
chmod +x quick_test.sh
./quick_test.sh
```

---

**Happy Docker Testing! 🐳🚀**
