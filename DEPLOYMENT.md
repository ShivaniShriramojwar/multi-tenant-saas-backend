# Deployment

## Local Setup

Requirements:

- Node.js 20+
- npm
- MongoDB
- Redis
- AWS S3 bucket and credentials for document features

Install and configure:

```bash
npm install
cp .env.example .env
```

Set at least:

```bash
PORT=5000
MONGO_URL=mongodb://127.0.0.1:27017/backend-saas?retryWrites=false
MONGO_USE_TRANSACTIONS=false
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:3000,http://localhost:5173
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-bucket
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

Start the API:

```bash
npm run dev
```

Start workers in separate terminals:

```bash
npm run worker:order
npm run worker:email
```

Run checks:

```bash
npm run typecheck
npm run lint
npm test
```

## Docker Setup

Build and run the compose stack:

```bash
docker compose up --build
```

The included compose file starts:

- `backend`: API process exposed as host `5001` to container `5000`.
- `worker`: default order worker through `npm run worker`.
- `mongo`: MongoDB on host `27017`.
- `redis`: Redis on host `6379`.

For a complete production-like compose setup, add a separate email worker service:

```yaml
email-worker:
  build: .
  env_file:
    - .env
  depends_on:
    - mongo
    - redis
  command: npm run worker:email
```

If using the compose Mongo container, set:

```bash
MONGO_URL=mongodb://mongo:27017/backend-saas?retryWrites=false
MONGO_USE_TRANSACTIONS=false
REDIS_HOST=redis
```

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | Recommended | HTTP port. Example uses `5000`; code fallback is `5001`. |
| `NODE_ENV` | Recommended | Use `production` in production. |
| `LOG_LEVEL` | No | Pino log level. Defaults to `info`. |
| `MONGO_URL` | Yes | MongoDB connection string. Use `retryWrites=false` for deployments that do not support retryable writes. |
| `MONGO_USE_TRANSACTIONS` | No | Set to `true` only when MongoDB supports transactions, such as a replica set or managed MongoDB cluster. Defaults to non-transactional registration. |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWTs. Use a long random value. |
| `CLIENT_URL` | Production yes | Comma-separated CORS allowed origins. |
| `REQUEST_BODY_LIMIT` | No | JSON and URL-encoded body limit. Defaults to `1mb`. |
| `READINESS_TIMEOUT_MS` | No | Per-dependency readiness timeout. Defaults to `3000`. |
| `REDIS_HOST` | Yes for queues | Redis host. Defaults to `127.0.0.1`. |
| `REDIS_PORT` | Yes for queues | Redis port. Defaults to `6379`. |
| `REDIS_PASSWORD` | If Redis requires it | Redis password. |
| `AWS_REGION` | Yes for S3 | AWS region for S3 client. |
| `AWS_ACCESS_KEY_ID` | Yes for S3 | AWS access key ID. Prefer instance/task roles in cloud environments when possible. |
| `AWS_SECRET_ACCESS_KEY` | Yes for S3 | AWS secret access key. Prefer managed credentials when possible. |
| `AWS_S3_BUCKET` | Yes for S3 | Bucket used for documents and attachments. |
| `AWS_S3_PUBLIC_BASE_URL` | No | Optional CDN/custom base URL for stored object URLs. |
| `AWS_S3_SIGNED_URL_EXPIRES_IN` | No | Signed download URL lifetime in seconds. Defaults to `300`. |
| `CLOUDINARY_CLOUD_NAME` | If using Cloudinary | Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` | If using Cloudinary | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | If using Cloudinary | Cloudinary API secret. |
| `EMAIL_DELIVERY_MODE` | No | `local`, `log`, or `fail`. Defaults to local-style provider IDs. |
| `EMAIL_WORKER_CONCURRENCY` | No | Email worker concurrency. Defaults to `5`. |

## Production Build

```bash
npm ci
npm run build
npm start
```

The `Dockerfile` performs:

1. `npm install`
2. source copy
3. `npm run build`
4. `npm start`

For stricter production images, prefer `npm ci`, multi-stage builds, and production-only dependencies in the final runtime image.

## Deployment Process

1. Confirm tests and static checks pass:

   ```bash
   npm run typecheck
   npm run lint
   npm test
   ```

2. Build the application:

   ```bash
   npm run build
   ```

3. Provision dependencies:

   - MongoDB replica set or managed MongoDB.
   - Redis with persistence and eviction policy appropriate for queues.
   - S3 bucket with private access.
   - Application runtime for API.
   - Separate worker runtimes for order and email workers.

4. Configure secrets and environment variables in the deployment platform.

5. Deploy the API process:

   ```bash
   npm start
   ```

6. Deploy workers:

   ```bash
   npm run worker:order
   npm run worker:email
   ```

7. Configure load balancer checks:

   - Liveness: `GET /health`
   - Readiness: `GET /ready`

8. Verify:

   - `/health` returns `200`.
   - `/ready` returns `200` and MongoDB, Redis, and S3 checks are `up`.
   - `/api-docs` loads.
   - Login works.
   - A document upload creates S3 object and MongoDB document metadata.
   - Order creation enqueues and completes a job.
   - Email creation is picked up by the email worker.

## Scaling Guidance

- API processes are stateless after MongoDB, Redis, and S3 are externalized.
- Run multiple API replicas behind a load balancer.
- Run workers independently and scale by queue depth.
- Keep API and worker versions aligned during deployments.
- Use graceful process shutdown in the hosting platform to avoid dropping in-flight requests or jobs.

## Rollback

1. Stop new deployment rollout.
2. Re-deploy the previous image or commit.
3. Keep database migrations backward compatible; this codebase currently does not include a migration runner.
4. Watch `/ready`, application logs, worker logs, queue failures, and error rates after rollback.
