# Security

## Security Model

The service relies on authenticated JWTs, tenant-scoped data access, centralized role permissions, object-level tenant validation, upload restrictions, rate limiting, CORS controls, and private S3 objects with signed download URLs.

## Authentication

- Passwords are hashed with bcrypt.
- Login returns an access token and a refresh token.
- Access token payloads include `userId`, `tenantId`, and `role`.
- Refresh tokens are stored as hashes in session records.
- Failed login attempts are tracked; accounts lock after five failed attempts for 15 minutes.
- Protected HTTP routes require `Authorization: Bearer <token>`.
- Socket.IO connections require the same JWT through socket auth or authorization headers.

## Tenant Isolation

Tenant isolation is mandatory for production safety:

- Never trust a tenant ID from request body or query when the authenticated tenant can be derived from the token.
- Controllers pass `req.user.tenantId` into services.
- Repositories filter tenant-owned records by `tenantId`.
- Services validate cross-entity links before creating dependent records.
- S3 keys include the tenant namespace.
- Socket rooms are derived from verified token claims.

Examples:

- Document upload validates the target project/task/bug/order/comment belongs to the authenticated tenant before writing S3 metadata.
- Notification creation validates both recipient and actor users belong to the same tenant.
- Email log queries validate `requestedBy` belongs to the same tenant.
- Developer and tester order reads are limited to their own user ID.

## RBAC Design

Roles:

- `super_admin`
- `head_product_manager`
- `team_lead`
- `developer`
- `tester`

The permission matrix is centralized in `src/common/permissions/role-permissions.ts`. Routes enforce permissions through `authorizePermission`.

Important design rules:

- Add new permissions to the `Permission` union.
- Add permissions to only the roles that require them.
- Apply `verifyToken` before `authorizePermission`.
- Keep object-level ownership checks in services even when route-level RBAC passes.
- Treat `super_admin` as tenant super admin, not necessarily global infrastructure admin.

## API Hardening

- `helmet()` sets standard HTTP security headers.
- CORS allowlist is based on `CLIENT_URL`; production should set explicit origins.
- JSON and URL-encoded payloads are limited by `REQUEST_BODY_LIMIT`.
- MongoDB query operator injection is reduced by stripping keys that start with `$` or contain `.` from body, query, and params.
- Global API rate limit: 100 requests per 15 minutes.
- Auth rate limit: 5 attempts per 10 minutes.
- Write rate limit: 30 write requests per minute.
- Zod validation is applied at route boundaries.
- Pino log redaction removes authorization headers, cookies, passwords, tokens, access tokens, and refresh tokens.

## File Upload Security

Uploads use Multer memory storage with explicit limits:

- Images: 2 MB
- PDFs: 5 MB
- Attachments: 10 MB
- Documents: 10 MB

Validation checks:

- Blocked executable/script extensions: `.bat`, `.cmd`, `.com`, `.exe`, `.js`, `.msi`, `.ps1`, `.sh`, `.vbs`
- MIME type allowlist
- Extension allowlist
- File size limit
- S3 key sanitization and random UUID suffixes

Production recommendations:

- Keep the S3 bucket private.
- Use least-privilege IAM policies for `PutObject`, `GetObject`, `DeleteObject`, and `HeadBucket` on only the required bucket/prefixes.
- Consider malware scanning for user-uploaded files before broad internal distribution.
- Prefer short signed URL expiry values.
- Serve downloads through signed URLs or a controlled CDN, not public bucket access.

## Secrets

Store secrets only in the deployment platform or a secret manager:

- `JWT_SECRET`
- MongoDB credentials
- Redis password
- AWS credentials
- Cloudinary credentials

Do not commit `.env`, production credentials, private keys, or generated tokens.

## Operational Security Checklist

- Set `NODE_ENV=production`.
- Set explicit `CLIENT_URL` origins.
- Use TLS at the load balancer or ingress.
- Use a long random `JWT_SECRET`.
- Rotate secrets on a schedule and immediately after suspected exposure.
- Restrict MongoDB and Redis network access to application infrastructure.
- Use managed IAM roles where possible instead of static AWS keys.
- Monitor failed logins, 401/403 rates, 429 rates, worker failures, S3 access failures, and readiness failures.
- Review permission changes and user role changes through audit logs.

## Known Gaps To Consider

- No database migration runner is currently documented in the codebase.
- Email delivery is provider-mode scaffolding; integrate a real transactional provider before sending external production email.
- The current Dockerfile is simple and not a minimal hardened production image.
- Upload validation is extension and MIME based; deep file inspection or malware scanning would strengthen document security.
