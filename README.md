# Backend SaaS API

Production-oriented multi-tenant SaaS backend built with Express, TypeScript, MongoDB, Redis/BullMQ, Socket.IO, and AWS S3.

## What This Service Provides

- Tenant registration and authentication with JWT access tokens and refresh sessions.
- Role-based access control for platform, product, delivery, QA, document, order, notification, email, analytics, and audit operations.
- Tenant-scoped project, task, bug, comment, activity, dashboard, analytics, search, report, document, email, notification, user, and order modules.
- Background queue processing for orders and email delivery.
- Real-time Socket.IO notifications scoped to tenant and user rooms.
- S3-backed document, invoice, and attachment storage with signed download URLs.
- Swagger/OpenAPI and Postman collection generation.

## Tech Stack

- Runtime: Node.js 20
- Language: TypeScript
- API: Express
- Database: MongoDB with Mongoose
- Queue: Redis and BullMQ
- Realtime: Socket.IO
- Storage: AWS S3, with Cloudinary configuration available for image storage
- Security: Helmet, CORS allowlist, rate limits, Mongo query sanitization, bcrypt, JWT
- Logging: Pino and pino-http
- Tests: Jest, ts-jest, Supertest

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md): architecture, module responsibilities, request flow, queues, S3 flow, notifications.
- [API.md](./API.md): API conventions, auth, endpoint inventory, OpenAPI links.
- [DEPLOYMENT.md](./DEPLOYMENT.md): local setup, Docker setup, environment variables, production deployment.
- [SECURITY.md](./SECURITY.md): tenant isolation, RBAC, auth, file security, operational controls.
- [RUNBOOK.md](./RUNBOOK.md): health checks, worker operations, incident response, maintenance tasks.

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

The API listens on `PORT` from `.env`. The default example uses `5000`; the server code falls back to `5001` if `PORT` is not set.

Useful URLs:

- API root: `http://localhost:5000/`
- Health: `http://localhost:5000/health`
- Readiness: `http://localhost:5000/ready`
- Swagger UI: `http://localhost:5000/api-docs`
- OpenAPI JSON: `http://localhost:5000/api-docs.json`
- Postman collection: `http://localhost:5000/api-docs/postman.json`

## Common Commands

```bash
npm run dev             # start API with ts-node-dev
npm run build           # compile TypeScript to dist
npm start               # run compiled API from dist/server.js
npm run worker:order    # start order worker
npm run worker:email    # start email worker
npm run lint            # run ESLint
npm run typecheck       # run TypeScript checks without emitting files
npm test                # run Jest tests
npm run test:coverage   # run Jest with coverage
```

## Docker

```bash
docker compose up --build
```

Compose starts the API, MongoDB, Redis, and the default order worker. For production, run both `npm run worker:order` and `npm run worker:email` as separate worker processes or services.

## Base API Path

All versioned API routes are mounted under:

```text
/api/v1
```

Most routes require:

```http
Authorization: Bearer <accessToken>
```

See [API.md](./API.md) for endpoint details.
