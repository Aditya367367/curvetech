# 🚀 Postman Testing Guide - Smart Device Management Backend

This guide provides all endpoints with exact values to test in Postman.

## 📋 Prerequisites

1. **Start Docker Compose:**
   ```bash
   docker-compose up --build -d
   ```

2. **Import Postman Collection:**
   - Import `api exports.postman_collection.json` into Postman
   - Or create a new collection and add requests manually

## 🔧 Collection Variables Setup

Set these variables in your Postman collection:

| Variable | Initial Value | Description |
|----------|---------------|-------------|
| `baseUrl` | `http://localhost:3000` | Base URL for all requests |
| `accessToken` | (empty) | Will be set automatically after login |
| `refreshToken` | (empty) | Will be set automatically after login |
| `deviceId` | (empty) | Will be set automatically after device creation |
| `exportJobId` | (empty) | Will be set automatically after export creation |

## 📝 Testing Sequence

### **1. Health & Monitoring Tests**

#### **1.1 Health Check**
- **Method:** `GET`
- **URL:** `{{baseUrl}}/health`
- **Headers:** None
- **Body:** None

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

#### **1.2 System Metrics**
- **Method:** `GET`
- **URL:** `{{baseUrl}}/health/metrics`
- **Headers:** None
- **Body:** None

**Expected Response:**
```json
{
  "success": true,
  "metrics": {
    "requestCount": 0,
    "averageResponseTime": 0,
    "errorRate": 0,
    "uptime": 1234567890
  }
}
```

#### **1.3 System Information**
- **Method:** `GET`
- **URL:** `{{baseUrl}}/health/system`
- **Headers:** None
- **Body:** None

**Expected Response:**
```json
{
  "success": true,
  "system": {
    "platform": "win32",
    "nodeVersion": "v18.0.0",
    "memoryUsage": {
      "rss": 12345678,
      "heapTotal": 12345678,
      "heapUsed": 12345678
    },
    "uptime": 1234567890
  }
}
```

### **2. Authentication Tests**

#### **2.1 User Registration**
- **Method:** `POST`
- **URL:** `{{baseUrl}}/auth/signup`
- **Headers:** 
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully"
}
```

#### **2.2 User Login**
- **Method:** `POST`
- **URL:** `{{baseUrl}}/auth/login`
- **Headers:** 
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
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

**Postman Test Script (to auto-save tokens):**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.collectionVariables.set('accessToken', response.token);
    pm.collectionVariables.set('refreshToken', response.refresh_token);
    console.log('Tokens saved to collection variables');
}
```

#### **2.3 Refresh Token**
- **Method:** `POST`
- **URL:** `{{baseUrl}}/auth/refresh`
- **Headers:** 
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "refresh_token": "{{refreshToken}}"
}
```

**Expected Response:**
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "access_expires_at": 1704067200,
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_expires_at": 1704672000
}
```

**Postman Test Script:**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.collectionVariables.set('accessToken', response.access_token);
    pm.collectionVariables.set('refreshToken', response.refresh_token);
    console.log('Tokens refreshed');
}
```

#### **2.4 Logout**
- **Method:** `POST`
- **URL:** `{{baseUrl}}/auth/logout`
- **Headers:** 
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "refresh_token": "{{refreshToken}}"
}
```

**Expected Response:**
```json
{
  "success": true
}
```

### **3. Device Management Tests**

#### **3.1 Get All Devices (Empty)**
- **Method:** `GET`
- **URL:** `{{baseUrl}}/devices`
- **Headers:** 
  - `Authorization: Bearer {{accessToken}}`
- **Body:** None

**Expected Response:**
```json
{
  "success": true,
  "devices": []
}
```

#### **3.2 Create Device**
- **Method:** `POST`
- **URL:** `{{baseUrl}}/devices`
- **Headers:** 
  - `Authorization: Bearer {{accessToken}}`
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "name": "Living Room Light",
  "type": "light",
  "status": "active"
}
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
    "owner": "user-id",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Postman Test Script:**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.collectionVariables.set('deviceId', response.device._id);
    console.log('Device ID saved:', response.device._id);
}
```

#### **3.3 Get Device by ID**
- **Method:** `GET`
- **URL:** `{{baseUrl}}/devices/{{deviceId}}`
- **Headers:** 
  - `Authorization: Bearer {{accessToken}}`
- **Body:** None

**Expected Response:**
```json
{
  "success": true,
  "device": {
    "_id": "{{deviceId}}",
    "name": "Living Room Light",
    "type": "light",
    "status": "active",
    "owner": "user-id",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### **3.4 Update Device**
- **Method:** `PATCH`
- **URL:** `{{baseUrl}}/devices/{{deviceId}}`
- **Headers:** 
  - `Authorization: Bearer {{accessToken}}`
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "name": "Updated Living Room Light",
  "status": "inactive"
}
```

**Expected Response:**
```json
{
  "success": true,
  "device": {
    "_id": "{{deviceId}}",
    "name": "Updated Living Room Light",
    "type": "light",
    "status": "inactive",
    "owner": "user-id",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### **3.5 Device Heartbeat**
- **Method:** `POST`
- **URL:** `{{baseUrl}}/devices/{{deviceId}}/heartbeat`
- **Headers:** 
  - `Authorization: Bearer {{accessToken}}`
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "status": "active",
  "metrics": {
    "battery": 85,
    "temperature": 25,
    "signalStrength": 90
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Device heartbeat recorded",
  "last_active_at": "2024-01-01T00:00:00.000Z"
}
```

#### **3.6 Delete Device**
- **Method:** `DELETE`
- **URL:** `{{baseUrl}}/devices/{{deviceId}}`
- **Headers:** 
  - `Authorization: Bearer {{accessToken}}`
- **Body:** None

**Expected Response:**
```json
{
  "success": true,
  "message": "Device removed"
}
```

### **4. Device Logs & Usage Tests**

#### **4.1 Create Log Entry**
- **Method:** `POST`
- **URL:** `{{baseUrl}}/devices/{{deviceId}}/logs`
- **Headers:** 
  - `Authorization: Bearer {{accessToken}}`
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "event": "units_consumed",
  "value": 10
}
```

**Expected Response:**
```json
{
  "success": true,
  "log": {
    "_id": "log-id",
    "device": "{{deviceId}}",
    "event": "units_consumed",
    "value": 10,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### **4.2 Get Device Logs**
- **Method:** `GET`
- **URL:** `{{baseUrl}}/devices/{{deviceId}}/logs?limit=10`
- **Headers:** 
  - `Authorization: Bearer {{accessToken}}`
- **Body:** None

**Expected Response:**
```json
{
  "success": true,
  "logs": [
    {
      "_id": "log-id",
      "device": "{{deviceId}}",
      "event": "units_consumed",
      "value": 10,
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### **4.3 Get Device Usage**
- **Method:** `GET`
- **URL:** `{{baseUrl}}/devices/{{deviceId}}/usage?range=24h`
- **Headers:** 
  - `Authorization: Bearer {{accessToken}}`
- **Body:** None

**Expected Response:**
```json
{
  "success": true,
  "device_id": "{{deviceId}}",
  "total_units_last_24h": 10
}
```

### **5. Analytics Tests**

#### **5.1 Analytics Summary**
- **Method:** `GET`
- **URL:** `{{baseUrl}}/analytics/summary?start=2024-01-01&end=2024-01-31`
- **Headers:** 
  - `Authorization: Bearer {{accessToken}}`
- **Body:** None

**Expected Response:**
```json
{
  "success": true,
  "cached": false,
  "summary": {
    "totalDevices": 1,
    "activeDevices": 1,
    "inactiveDevices": 0,
    "totalLogs": 1,
    "totalUsage": 10,
    "deviceTypes": {
      "light": 1
    }
  }
}
```

#### **5.2 Device Analytics**
- **Method:** `GET`
- **URL:** `{{baseUrl}}/analytics/devices/{{deviceId}}?start=2024-01-01&end=2024-01-31`
- **Headers:** 
  - `Authorization: Bearer {{accessToken}}`
- **Body:** None

**Expected Response:**
```json
{
  "success": true,
  "cached": false,
  "deviceAnalytics": {
    "deviceId": "{{deviceId}}",
    "totalLogs": 1,
    "totalUsage": 10,
    "averageUsage": 10,
    "lastActivity": "2024-01-01T00:00:00.000Z",
    "status": "active"
  }
}
```

#### **5.3 System Metrics**
- **Method:** `GET`
- **URL:** `{{baseUrl}}/analytics/system`
- **Headers:** 
  - `Authorization: Bearer {{accessToken}}`
- **Body:** None

**Expected Response:**
```json
{
  "success": true,
  "cached": false,
  "metrics": {
    "totalUsers": 1,
    "totalDevices": 1,
    "totalLogs": 1,
    "systemUptime": 1234567890,
    "averageResponseTime": 150,
    "requestsPerMinute": 5
  }
}
```

### **6. Data Export Tests**

#### **6.1 Enqueue Device Export**
- **Method:** `POST`
- **URL:** `{{baseUrl}}/export`
- **Headers:** 
  - `Authorization: Bearer {{accessToken}}`
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "type": "devices",
  "format": "json",
  "filters": {
    "status": "active"
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "jobId": "export-job-id",
  "message": "Export job queued successfully"
}
```

**Postman Test Script:**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.collectionVariables.set('exportJobId', response.jobId);
    console.log('Export job ID saved:', response.jobId);
}
```

#### **6.2 Enqueue Logs Export**
- **Method:** `POST`
- **URL:** `{{baseUrl}}/export`
- **Headers:** 
  - `Authorization: Bearer {{accessToken}}`
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "type": "logs",
  "format": "csv",
  "filters": {
    "deviceId": "{{deviceId}}",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z",
    "event": "units_consumed"
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "jobId": "export-job-id-2",
  "message": "Export job queued successfully"
}
```

#### **6.3 Enqueue Analytics Export**
- **Method:** `POST`
- **URL:** `{{baseUrl}}/export`
- **Headers:** 
  - `Authorization: Bearer {{accessToken}}`
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "type": "analytics",
  "format": "json",
  "filters": {
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z"
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "jobId": "export-job-id-3",
  "message": "Export job queued successfully"
}
```

#### **6.4 List Export Jobs**
- **Method:** `GET`
- **URL:** `{{baseUrl}}/export`
- **Headers:** 
  - `Authorization: Bearer {{accessToken}}`
- **Body:** None

**Expected Response:**
```json
{
  "success": true,
  "jobs": [
    {
      "id": "{{exportJobId}}",
      "type": "devices",
      "format": "json",
      "status": "completed",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "completedAt": "2024-01-01T00:00:05.000Z"
    }
  ]
}
```

#### **6.5 Check Export Status**
- **Method:** `GET`
- **URL:** `{{baseUrl}}/export/{{exportJobId}}/status`
- **Headers:** 
  - `Authorization: Bearer {{accessToken}}`
- **Body:** None

**Expected Response:**
```json
{
  "success": true,
  "job": {
    "id": "{{exportJobId}}",
    "type": "devices",
    "format": "json",
    "status": "completed",
    "progress": 100,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "completedAt": "2024-01-01T00:00:05.000Z",
    "filePath": "/exports/devices_20240101_000000.json"
  }
}
```

#### **6.6 Download Export**
- **Method:** `GET`
- **URL:** `{{baseUrl}}/export/{{exportJobId}}/download`
- **Headers:** 
  - `Authorization: Bearer {{accessToken}}`
- **Body:** None

**Expected Response:** File download (JSON or CSV content)

### **7. Real-time Communication Tests**

#### **7.1 SSE Stream**
- **Method:** `GET`
- **URL:** `{{baseUrl}}/realtime/stream`
- **Headers:** 
  - `Authorization: Bearer {{accessToken}}`
  - `Accept: text/event-stream`
- **Body:** None

**Expected Response:** Event stream with real-time updates

### **8. Additional Device Tests**

#### **8.1 Get Devices with Filters**
- **Method:** `GET`
- **URL:** `{{baseUrl}}/devices?type=light&status=active`
- **Headers:** 
  - `Authorization: Bearer {{accessToken}}`
- **Body:** None

**Expected Response:**
```json
{
  "success": true,
  "devices": [
    {
      "_id": "{{deviceId}}",
      "name": "Living Room Light",
      "type": "light",
      "status": "active",
      "owner": "user-id"
    }
  ]
}
```

#### **8.2 Create Multiple Logs**
- **Method:** `POST`
- **URL:** `{{baseUrl}}/devices/{{deviceId}}/logs`
- **Headers:** 
  - `Authorization: Bearer {{accessToken}}`
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "event": "power_on",
  "value": 1
}
```

**Expected Response:**
```json
{
  "success": true,
  "log": {
    "_id": "log-id-2",
    "device": "{{deviceId}}",
    "event": "power_on",
    "value": 1,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🔍 Testing Tips

### **1. Test Order**
1. Start with health checks
2. Register and login to get tokens
3. Create a device
4. Test all device operations
5. Create logs and test analytics
6. Test export functionality
7. Test real-time features
8. Clean up by deleting device and logging out

### **2. Error Testing**
Test these scenarios:
- **401 Unauthorized:** Remove Authorization header
- **400 Bad Request:** Send invalid JSON
- **404 Not Found:** Use non-existent device ID
- **403 Forbidden:** Try to access another user's device
- **429 Too Many Requests:** Make rapid requests

### **3. Performance Testing**
- Test response times for each endpoint
- Check caching behavior (look for `"cached": true` in responses)
- Test concurrent requests

### **4. Data Validation**
- Verify all required fields are present
- Check data types and formats
- Validate timestamps are in ISO format
- Ensure IDs are valid MongoDB ObjectIds

## 📊 Expected Test Results

### **Success Criteria**
- ✅ All health endpoints return 200 OK
- ✅ Authentication flow works end-to-end
- ✅ Device CRUD operations work correctly
- ✅ Analytics endpoints return valid data
- ✅ Export jobs are created and processed
- ✅ Real-time endpoints establish connections
- ✅ Rate limiting works as expected
- ✅ Error handling returns appropriate status codes

### **Performance Expectations**
- Health checks: < 100ms
- Device operations: < 200ms
- Analytics queries: < 500ms (first request), < 100ms (cached)
- Export job creation: < 100ms
- Export processing: < 5 seconds for small datasets

---

