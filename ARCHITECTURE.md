# Architecture

## System Overview

The backend is a modular Express API. HTTP requests enter through `src/app.ts`, are routed under `/api/v1`, pass through security, logging, rate-limit, authentication, validation, and authorization middleware, then reach module controllers. Controllers delegate business behavior to services, services use repositories for MongoDB persistence, and infrastructure adapters handle MongoDB, Redis/BullMQ, S3, Cloudinary, and Socket.IO.

```text
Client / Browser / Mobile App
        |
        | HTTP + Bearer JWT
        v
Express app
  helmet, CORS, body limits, Mongo sanitization, request logs
        |
        v
/api/v1 root router
        |
        v
Module route -> auth -> RBAC -> Zod validation -> controller
        |
        v
Service layer
        |
        +--> Repository layer -> MongoDB
        +--> BullMQ queues -> Redis -> workers -> MongoDB
        +--> S3 storage -> signed URLs
        +--> Socket.IO tenant/user notifications
        +--> Audit logs
```

## Runtime Components

- API process: `src/server.ts` connects MongoDB, creates the HTTP server, initializes Socket.IO, registers order queue events, and listens on `PORT`.
- MongoDB: primary persistence for tenants, users, sessions, domain records, documents, notifications, email logs, analytics, and audit logs.
- Redis: queue backend for BullMQ order and email jobs.
- Workers: `order.worker.ts` and `email.worker.ts` run as separate long-lived processes.
- S3: object storage for documents, invoices, and order attachments.
- Socket.IO: realtime notifications for tenant-wide and user-specific events.
- Swagger docs: exposed from `src/docs/swagger.ts` at `/api-docs` and `/api-docs.json`.

## Module Responsibilities

- `auth`: registration, login, refresh sessions, logout, session listing, session revocation.
- `tenant`: tenant model used during registration and scoping.
- `user`: user profile, tenant users, role changes, tenant membership checks.
- `permission`: role permission inspection and role update flows.
- `project`: tenant-scoped project CRUD.
- `task`: tenant-scoped tasks, assignment, status, and priority updates.
- `bug`: tenant-scoped bug tracking, assignment, severity, priority, and status updates.
- `comment`: tenant-scoped comments linked to project/task/bug/order/comment entities.
- `document`: S3-backed document upload, metadata, listing, signed download URLs, update, delete.
- `order`: order creation, lookup, deletion, invoice upload, attachments, order queue dispatch.
- `notification`: in-app notifications, unread counts, read/archive/delete operations, Socket.IO emission.
- `email`: email log creation, summary/listing, retry, and queued delivery.
- `activity`: tenant-scoped activity feed and activity audit-style records.
- `analytics`: custom tenant analytics event ingestion and reporting.
- `dashboard`: aggregate tenant counts for core operational objects.
- `audit`: immutable-ish audit records for important actions.
- `search`: tenant-scoped cross-module search.
- `report`: tenant reports for projects, tasks, bugs, team workload, orders, and audit activity.

## Request Flow

1. `src/app.ts` applies global middleware: Helmet, CORS, JSON/body limits, URL encoding, Mongo key sanitization, and request logging.
2. `/health`, `/ready`, `/api-docs`, `/api-docs.json`, and `/api-docs/postman.json` are served before the versioned router.
3. `/api/v1` requests pass through `apiLimiter`.
4. Module routes apply route-specific middleware:
   - `verifyToken` decodes the JWT and attaches `req.user`.
   - `authorizePermission` or `authorizeRoles` checks RBAC.
   - `validate` applies Zod schemas to params, query, and body.
   - Upload routes use Multer memory storage and file validation.
5. Controllers call services with `tenantId`, `userId`, role, validated data, and files from the request.
6. Services enforce tenant ownership, orchestrate persistence, storage, queues, audit logs, and notifications.
7. Repositories query MongoDB with tenant filters.
8. Errors are normalized by the global `errorHandler`.

## Tenant Isolation Strategy

Tenant isolation is enforced at several layers:

- JWT payloads include `tenantId`, `userId`, and `role`.
- Controllers pass `req.user.tenantId` into service methods rather than trusting client-supplied tenant identifiers.
- Repositories query tenant-owned data with `{ tenantId }` filters.
- Cross-entity operations validate ownership before linking records, for example documents validate that the target project, task, bug, order, or comment belongs to the same tenant.
- S3 object keys include the tenant namespace: `backend-saas/{tenantId}/...`.
- Socket.IO connections join `tenant:{tenantId}` and `user:{userId}` rooms derived from the verified JWT.
- Notifications, email logs, audit logs, dashboard counts, reports, analytics, search, documents, projects, tasks, bugs, comments, activities, and orders are tenant-scoped.

## RBAC Design

Roles are defined in `src/common/constants/roles.ts`:

- `super_admin`
- `head_product_manager`
- `team_lead`
- `developer`
- `tester`

Permissions are centralized in `src/common/permissions/role-permissions.ts`. Routes call `authorizePermission("<permission>")` to check the authenticated user's role against the permission matrix.

Design principles:

- Permission names describe actions, such as `create_project`, `view_document`, `delete_order`, and `view_audit_logs`.
- Route middleware performs coarse authorization.
- Services perform ownership and tenant checks for object-level authorization.
- Lower-privileged order access is narrowed further in `order.service.ts`: developers and testers only see their own orders.

## Queue And Worker Flow

The queue layer uses BullMQ with Redis configured by `src/infrastructure/queue/redis.ts`.

Order flow:

1. `createOrderService` creates an order in MongoDB.
2. It enqueues `process-order` on `order-queue` with `orderId` and `tenantId`.
3. `order.worker.ts` connects to MongoDB and Redis.
4. The worker marks the order `processing`.
5. The job retries with exponential backoff; after the current simulated transient failures, successful processing marks the order `completed`.
6. If retries are exhausted, the worker marks the order `failed`.
7. Queue events and worker lifecycle events are logged with Pino.

Email flow:

1. `sendEmailService` creates an email log in MongoDB.
2. It enqueues `deliver-email` on `email-queue`.
3. `email.worker.ts` loads the email log by `emailLogId` and `tenantId`.
4. Already-sent logs are skipped idempotently.
5. `deliverEmailLog` calls the configured provider mode and updates status to `sent` or `failed`.
6. If enqueue fails, the service falls back to immediate in-process delivery.

## S3 Document Flow

1. The client uploads multipart files to a document or order upload endpoint.
2. Multer keeps files in memory and applies size, extension, and MIME validation.
3. The service validates the target entity belongs to the authenticated user's tenant.
4. The service builds a tenant-prefixed S3 key.
5. `uploadToS3` writes the object using AWS SDK v3.
6. Metadata is stored in the `Document` collection, including original name, MIME type, extension, size, S3 key, URL, category, tags, tenant, entity type, entity ID, and uploader.
7. Audit logs are written for document lifecycle events.
8. Tenant notifications are emitted for uploads, updates, and deletes.
9. Download endpoints return signed S3 URLs with configurable expiry instead of proxying file bytes through the API.

## Notification Flow

There are two notification paths:

- Explicit notifications: `notification.service.ts` creates notification records and emits to `user:{recipientId}`.
- Domain events: modules such as order and document emit tenant-wide events to `tenant:{tenantId}`.

Socket authentication uses the same JWT verification utility as HTTP auth. On connection, the socket joins tenant and user rooms and receives a `socket.connected` notification.

## Health And Readiness

- `/health`: lightweight liveness response with uptime.
- `/ready`: dependency readiness check for MongoDB, Redis, and S3 bucket access.

Production load balancers should use `/health` for liveness and `/ready` for readiness.
