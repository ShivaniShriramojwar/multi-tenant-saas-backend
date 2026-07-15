# API

## API Conventions

Base path:

```text
/api/v1
```

Authentication header for protected routes:

```http
Authorization: Bearer <accessToken>
```

Responses generally use:

```json
{
  "message": "Human readable status",
  "data": {}
}
```

Paginated endpoints include a `pagination` object. Common query fields are `page`, `limit`, `search`, status filters, date filters, and module-specific IDs.

## Interactive Documentation

When the server is running:

- Swagger UI: `/api-docs`
- OpenAPI JSON: `/api-docs.json`
- Postman collection: `/api-docs/postman.json`

The source OpenAPI export is also checked in under `docs/openapi.json` with a Postman collection under `docs/postman_collection.json`.

## Authentication

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Register a tenant and first `super_admin` user. |
| `POST` | `/api/v1/auth/login` | Login and receive access and refresh tokens. |
| `POST` | `/api/v1/auth/refresh` | Exchange refresh token for a new access token. |
| `POST` | `/api/v1/auth/logout` | Revoke the current refresh session. |
| `GET` | `/api/v1/auth/sessions` | List active sessions for the authenticated user. |
| `DELETE` | `/api/v1/auth/sessions/:id` | Revoke a session. |

Registration creates both a tenant and its first user in a MongoDB transaction. Login returns a JWT whose payload contains `userId`, `tenantId`, and `role`.

## Endpoint Inventory

| Module | Methods And Paths |
| --- | --- |
| Users | `GET /users/profile`, `POST /users/profile/image`, `POST /users`, `GET /users`, `PATCH /users/:id/role`, `DELETE /users/:id` |
| Permissions | `GET /permissions`, `PATCH /permissions` |
| Projects | `POST /projects`, `GET /projects`, `GET /projects/:id`, `PUT /projects/:id`, `DELETE /projects/:id` |
| Tasks | `POST /tasks`, `GET /tasks`, `GET /tasks/:id`, `PUT /tasks/:id`, `DELETE /tasks/:id`, `PATCH /tasks/:id/status`, `PATCH /tasks/:id/assign` |
| Bugs | `POST /bugs`, `GET /bugs`, `GET /bugs/:id`, `PUT /bugs/:id`, `PATCH /bugs/:id/status`, `PATCH /bugs/:id/assign`, `PATCH /bugs/:id/severity`, `PATCH /bugs/:id/priority`, `DELETE /bugs/:id` |
| Comments | `POST /comments`, `GET /comments`, `GET /comments/:id`, `PUT /comments/:id`, `DELETE /comments/:id` |
| Documents | `POST /documents`, `GET /documents`, `GET /documents/:id`, `GET /documents/:id/download-url`, `GET /documents/:id/download`, `PUT /documents/:id`, `DELETE /documents/:id` |
| Orders | `POST /orders`, `GET /orders`, `GET /orders/:id`, `POST /orders/:id/invoice`, `POST /orders/:id/attachments`, `DELETE /orders/:id` |
| Notifications | `POST /notifications`, `GET /notifications`, `GET /notifications/:id`, `PATCH /notifications/:id/read`, `GET /notifications/unread-count`, `PATCH /notifications/read-all`, `PATCH /notifications/:id/archive`, `DELETE /notifications/:id` |
| Activities | `POST /activities`, `GET /activities`, `GET /activities/:id`, `GET /activities/entity/:targetType/:targetId`, `DELETE /activities/:id` |
| Analytics | `POST /analytics/events`, `GET /analytics/events`, `GET /analytics/events/:id`, `GET /analytics/summary`, `GET /analytics/trend`, `GET /analytics/top-events` |
| Email | `POST /emails`, `GET /emails`, `GET /emails/summary`, `GET /emails/:id`, `PATCH /emails/:id/retry` |
| Audit Logs | `GET /audit-logs` |
| Dashboard | `GET /dashboard` |
| Search | `GET /search` |
| Reports | `GET /reports/projects`, `GET /reports/tasks`, `GET /reports/bugs`, `GET /reports/team-workload`, `GET /reports/orders`, `GET /reports/audit` |

All paths in this table are relative to `/api/v1`.

## Authorization

Protected routes first require a valid bearer token. Most module routes then require a permission such as:

- `manage_users`
- `create_project`
- `view_project`
- `update_task`
- `delete_bug`
- `upload_document`
- `view_document`
- `create_notification`
- `view_audit_logs`

Permissions are mapped by role in `src/common/permissions/role-permissions.ts`.

## File Upload APIs

Document upload:

```http
POST /api/v1/documents
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

Use the form field `documents` for up to 10 files. The request must target exactly one entity using either `entityType` plus `entityId`, or one of the supported shortcut IDs such as `projectId`, `taskId`, `bugId`, or `orderId`.

Order invoice upload accepts a single PDF. Order attachments accept document-style files.

## Realtime API

Socket.IO clients connect to the same HTTP server and provide the JWT through `handshake.auth.token` or an `Authorization: Bearer <token>` header.

After authentication, the socket joins:

- `tenant:{tenantId}`
- `user:{userId}`

Notifications are emitted on the `notification` event.

## Health APIs

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Liveness check. |
| `GET` | `/ready` | Readiness check for MongoDB, Redis, and S3. |
| `GET` | `/` | Simple gateway status text. |
