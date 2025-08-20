# CurvvTech Backend

## Features
- JWT Auth (signup/login)
- Device CRUD, filtering, heartbeat
- Logs & usage endpoints
- Rate limiting (100 req/min/user)
- Auto-deactivate inactive devices (24h)
- Validation (Joi)
- Dockerized (Dockerfile, docker-compose)
- Unit tests (Jest, mongodb-memory-server)

## Setup

### Local
```sh
npm install
cp .env.example .env # or edit .env
npm run dev
```

### Docker
```sh
docker compose up --build
```

### Run Tests
```sh
npm test
```
or in Docker:
```sh
docker compose exec app npm test
```

## API Documentation

### Auth
- `POST /auth/signup` `{ name, email, password }`
- `POST /auth/login` `{ email, password }`

### Devices
- `GET /devices` (filter: `?type=light&status=active`)
- `POST /devices` `{ name, type, status }`
- `PATCH /devices/:id` `{ name?, type?, status? }`
- `DELETE /devices/:id`
- `POST /devices/:id/heartbeat` `{ status? }`

### Logs
- `POST /devices/:id/logs` `{ event, value }`
- `GET /devices/:id/logs`
- `GET /devices/:id/usage?range=24h`

### Rate Limiting
- 100 requests/minute per user (returns 429 if exceeded)

### Background Job
- Devices auto-deactivate if `last_active_at` > 24h

## Edge Cases & Error Handling
- 400: Validation errors
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (not owner)
- 404: Not found (device/log)
- 429: Too many requests

## Postman Collection
- [Export and attach your collection here]

## Assumptions
- Only device owners can access/modify their devices/logs.
- All endpoints require JWT except `/auth/*`.

## Outputs
- All tests should pass with `npm test`.
- Rate limit test: 101st request returns 429.
- Device auto-deactivation test: status changes to 'inactive' after job runs.

---

## 5. **Instructions for Testing**

- Run `npm test` to execute all tests.
- Tests cover:
  - Auth flow
  - Device CRUD/filtering
  - Rate limiting (429 after 100 requests)
  - Device auto-deactivation (job)
  - Log endpoints (create, get, usage)
  - Edge cases (unauthorized, forbidden, not found, validation)

---

**If you want the full codebase with these changes, copy the above code blocks into your project as new files or updates.**  
Let me know if you want any file in full or a specific part explained!# CurvvTech Backend

## Features
- JWT Auth (signup/login)
- Device CRUD, filtering, heartbeat
- Logs & usage endpoints
- Rate limiting (100 req/min/user)
- Auto-deactivate inactive devices (24h)
- Validation (Joi)
- Dockerized (Dockerfile, docker-compose)
- Unit tests (Jest, mongodb-memory-server)

## Setup

### Local
```sh
npm install
cp .env.example .env # or edit .env
npm run dev
```

### Docker
```sh
docker compose up --build
```

### Run Tests
```sh
npm test
```
or in Docker:
```sh
docker compose exec app npm test
```

## API Documentation

### Auth
- `POST /auth/signup` `{ name, email, password }`
- `POST /auth/login` `{ email, password }`

### Devices
- `GET /devices` (filter: `?type=light&status=active`)
- `POST /devices` `{ name, type, status }`
- `PATCH /devices/:id` `{ name?, type?, status? }`
- `DELETE /devices/:id`
- `POST /devices/:id/heartbeat` `{ status? }`

### Logs
- `POST /devices/:id/logs` `{ event, value }`
- `GET /devices/:id/logs`
- `GET /devices/:id/usage?range=24h`

### Rate Limiting
- 100 requests/minute per user (returns 429 if exceeded)

### Background Job
- Devices auto-deactivate if `last_active_at` > 24h

## Edge Cases & Error Handling
- 400: Validation errors
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (not owner)
- 404: Not found (device/log)
- 429: Too many requests

## Postman Collection
- [Export and attach your collection here]

## Assumptions
- Only device owners can access/modify their devices/logs.
- All endpoints require JWT except `/auth/*`.

## Outputs
- All tests should pass with `npm test`.
- Rate limit test: 101st request returns 429.
- Device auto-deactivation test: status changes to 'inactive' after job runs.

---

## 5. **Instructions for Testing**

- Run `npm test` to execute all tests.
- Tests cover:
  - Auth flow
  - Device CRUD/filtering
  - Rate limiting (429 after 100 requests)
  - Device auto-deactivation (job)
  - Log endpoints (create, get, usage)
  - Edge cases (unauthorized, forbidden, not found, validation)

---
## Postman Collection
- See [api exports.postman_collection.json](./api%20exports.postman_collection.json) for ready-to-use API requests.
