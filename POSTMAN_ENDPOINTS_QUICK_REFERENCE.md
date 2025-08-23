# 🚀 Postman Endpoints Quick Reference

## 📋 Setup
1. **Start Docker:** `docker-compose up --build -d`
2. **Base URL:** `http://localhost:3000`
3. **Collection Variables:** `baseUrl`, `accessToken`, `refreshToken`, `deviceId`, `exportJobId`

---

## 🔧 Health & Monitoring

| Method | URL | Headers | Body | Expected Status |
|--------|-----|---------|------|-----------------|
| GET | `{{baseUrl}}/health` | None | None | 200 |
| GET | `{{baseUrl}}/health/metrics` | None | None | 200 |
| GET | `{{baseUrl}}/health/system` | None | None | 200 |

---

## 🔐 Authentication

| Method | URL | Headers | Body | Expected Status |
|--------|-----|---------|------|-----------------|
| POST | `{{baseUrl}}/auth/signup` | `Content-Type: application/json` | ```json<br>{<br>  "name": "John Doe",<br>  "email": "john@example.com",<br>  "password": "password123",<br>  "role": "user"<br>}``` | 200 |
| POST | `{{baseUrl}}/auth/login` | `Content-Type: application/json` | ```json<br>{<br>  "email": "john@example.com",<br>  "password": "password123"<br>}``` | 200 |
| POST | `{{baseUrl}}/auth/refresh` | `Content-Type: application/json` | ```json<br>{<br>  "refresh_token": "{{refreshToken}}"<br>}``` | 200 |
| POST | `{{baseUrl}}/auth/logout` | `Content-Type: application/json` | ```json<br>{<br>  "refresh_token": "{{refreshToken}}"<br>}``` | 200 |

---

## 📱 Device Management

| Method | URL | Headers | Body | Expected Status |
|--------|-----|---------|------|-----------------|
| GET | `{{baseUrl}}/devices` | `Authorization: Bearer {{accessToken}}` | None | 200 |
| POST | `{{baseUrl}}/devices` | `Authorization: Bearer {{accessToken}}`<br>`Content-Type: application/json` | ```json<br>{<br>  "name": "Living Room Light",<br>  "type": "light",<br>  "status": "active"<br>}``` | 200 |
| GET | `{{baseUrl}}/devices/{{deviceId}}` | `Authorization: Bearer {{accessToken}}` | None | 200 |
| PATCH | `{{baseUrl}}/devices/{{deviceId}}` | `Authorization: Bearer {{accessToken}}`<br>`Content-Type: application/json` | ```json<br>{<br>  "name": "Updated Living Room Light",<br>  "status": "inactive"<br>}``` | 200 |
| DELETE | `{{baseUrl}}/devices/{{deviceId}}` | `Authorization: Bearer {{accessToken}}` | None | 200 |

---

## 💓 Device Heartbeat

| Method | URL | Headers | Body | Expected Status |
|--------|-----|---------|------|-----------------|
| POST | `{{baseUrl}}/devices/{{deviceId}}/heartbeat` | `Authorization: Bearer {{accessToken}}`<br>`Content-Type: application/json` | ```json<br>{<br>  "status": "active",<br>  "metrics": {<br>    "battery": 85,<br>    "temperature": 25,<br>    "signalStrength": 90<br>  }<br>}``` | 200 |

---

## 📊 Device Logs & Usage

| Method | URL | Headers | Body | Expected Status |
|--------|-----|---------|------|-----------------|
| POST | `{{baseUrl}}/devices/{{deviceId}}/logs` | `Authorization: Bearer {{accessToken}}`<br>`Content-Type: application/json` | ```json<br>{<br>  "event": "units_consumed",<br>  "value": 10<br>}``` | 200 |
| GET | `{{baseUrl}}/devices/{{deviceId}}/logs?limit=10` | `Authorization: Bearer {{accessToken}}` | None | 200 |
| GET | `{{baseUrl}}/devices/{{deviceId}}/usage?range=24h` | `Authorization: Bearer {{accessToken}}` | None | 200 |

---

## 📈 Analytics

| Method | URL | Headers | Body | Expected Status |
|--------|-----|---------|------|-----------------|
| GET | `{{baseUrl}}/analytics/summary?start=2024-01-01&end=2024-01-31` | `Authorization: Bearer {{accessToken}}` | None | 200 |
| GET | `{{baseUrl}}/analytics/devices/{{deviceId}}?start=2024-01-01&end=2024-01-31` | `Authorization: Bearer {{accessToken}}` | None | 200 |
| GET | `{{baseUrl}}/analytics/system` | `Authorization: Bearer {{accessToken}}` | None | 200 |

---

## 📤 Data Export

| Method | URL | Headers | Body | Expected Status |
|--------|-----|---------|------|-----------------|
| POST | `{{baseUrl}}/export` | `Authorization: Bearer {{accessToken}}`<br>`Content-Type: application/json` | ```json<br>{<br>  "type": "devices",<br>  "format": "json",<br>  "filters": {<br>    "status": "active"<br>  }<br>}``` | 200 |
| GET | `{{baseUrl}}/export` | `Authorization: Bearer {{accessToken}}` | None | 200 |
| GET | `{{baseUrl}}/export/{{exportJobId}}/status` | `Authorization: Bearer {{accessToken}}` | None | 200 |
| GET | `{{baseUrl}}/export/{{exportJobId}}/download` | `Authorization: Bearer {{accessToken}}` | None | 200 |

---

## 🔄 Real-time Communication

| Method | URL | Headers | Body | Expected Status |
|--------|-----|---------|------|-----------------|
| GET | `{{baseUrl}}/realtime/stream` | `Authorization: Bearer {{accessToken}}`<br>`Accept: text/event-stream` | None | 200 |

---

## 📝 Postman Test Scripts

### Login (Auto-save tokens)
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.collectionVariables.set('accessToken', response.token);
    pm.collectionVariables.set('refreshToken', response.refresh_token);
    console.log('Tokens saved to collection variables');
}
```

### Create Device (Auto-save device ID)
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.collectionVariables.set('deviceId', response.device._id);
    console.log('Device ID saved:', response.device._id);
}
```

### Create Export (Auto-save job ID)
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.collectionVariables.set('exportJobId', response.jobId);
    console.log('Export job ID saved:', response.jobId);
}
```

---

## 🧪 Testing Sequence

1. **Health Check** → `GET /health`
2. **Register User** → `POST /auth/signup`
3. **Login** → `POST /auth/login` (saves tokens)
4. **Get Devices** → `GET /devices` (should be empty)
5. **Create Device** → `POST /devices` (saves device ID)
6. **Get Device** → `GET /devices/{{deviceId}}`
7. **Update Device** → `PATCH /devices/{{deviceId}}`
8. **Device Heartbeat** → `POST /devices/{{deviceId}}/heartbeat`
9. **Create Log** → `POST /devices/{{deviceId}}/logs`
10. **Get Logs** → `GET /devices/{{deviceId}}/logs`
11. **Get Usage** → `GET /devices/{{deviceId}}/usage`
12. **Analytics Summary** → `GET /analytics/summary`
13. **Device Analytics** → `GET /analytics/devices/{{deviceId}}`
14. **System Metrics** → `GET /analytics/system`
15. **Create Export** → `POST /export` (saves job ID)
16. **List Exports** → `GET /export`
17. **Check Export Status** → `GET /export/{{exportJobId}}/status`
18. **Download Export** → `GET /export/{{exportJobId}}/download`
19. **SSE Stream** → `GET /realtime/stream`
20. **Delete Device** → `DELETE /devices/{{deviceId}}`
21. **Logout** → `POST /auth/logout`

---

## ⚡ Quick Start Commands

```bash
# Start the application
docker-compose up --build -d

# Check if running
curl http://localhost:3000/health

# Test registration
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123","role":"user"}'
```

---

**🎯 Happy Testing!**
