# Runbook

## Service Map

- API: `npm start` after `npm run build`, or `npm run dev` locally.
- Order worker: `npm run worker:order`.
- Email worker: `npm run worker:email`.
- MongoDB: persistent application database.
- Redis: BullMQ queue backend.
- S3: document, invoice, and attachment object storage.

## Health Checks

Liveness:

```bash
curl http://localhost:5000/health
```

Expected:

```json
{
  "status": "ok",
  "uptime": 123.45
}
```

Readiness:

```bash
curl http://localhost:5000/ready
```

Expected when healthy:

```json
{
  "status": "ready",
  "checks": {
    "mongo": { "status": "up" },
    "redis": { "status": "up" },
    "s3": { "status": "up" }
  }
}
```

If `/ready` returns `503`, check the dependency named as `down`.

## Startup Checklist

1. Confirm environment variables are present.
2. Confirm MongoDB is reachable from the API and workers.
3. Confirm Redis is reachable from the API and workers.
4. Confirm S3 credentials can access the configured bucket.
5. Start API process.
6. Start order worker.
7. Start email worker.
8. Check `/health`, `/ready`, `/api-docs`, login, document upload, and queue processing.

## Common Incidents

### API Will Not Start

Symptoms:

- Process exits on startup.
- Logs contain `Server startup failed` or `MongoDB connection error`.

Actions:

1. Check `MONGO_URI`.
2. Check MongoDB network access and credentials.
3. Confirm `PORT` is available.
4. Run `npm run build` to catch TypeScript compilation errors.
5. Review recent environment or dependency changes.

### Readiness Is Down

MongoDB down:

- Check MongoDB connection string, credentials, IP allowlist, and server health.
- Confirm database is not overloaded.

Redis down:

- Check `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD`.
- Confirm Redis accepts connections from API and workers.

S3 down:

- Check `AWS_REGION`, `AWS_S3_BUCKET_NAME`, and AWS credentials.
- Confirm the bucket exists and the principal can call `HeadBucket`.

### Order Jobs Are Not Completing

Symptoms:

- Orders remain `pending` or `processing`.
- Worker logs show repeated job failures.

Actions:

1. Confirm `npm run worker:order` is running.
2. Confirm worker can connect to MongoDB and Redis.
3. Check logs for `Order job failed`.
4. Inspect Redis queue depth and failed jobs.
5. Confirm order records still exist in MongoDB.
6. Restart the worker after dependency recovery.

Note: the current worker intentionally throws temporary failures before completing on a later attempt, so short-lived retries are expected.

### Email Jobs Are Not Sending

Symptoms:

- Email logs remain `queued`.
- Worker logs show `Email job failed`.

Actions:

1. Confirm `npm run worker:email` is running.
2. Check `EMAIL_DELIVERY_MODE`; `fail` intentionally marks delivery as failed.
3. Confirm worker can connect to MongoDB and Redis.
4. Use the retry endpoint for failed email logs after fixing the cause.
5. If Redis enqueue fails, the service attempts immediate in-process delivery; check API logs too.

### Document Upload Fails

Common causes:

- Missing S3 environment variables.
- File too large.
- Unsupported MIME type or extension.
- Blocked script/executable extension.
- Target entity does not belong to the tenant.
- S3 bucket permission issue.

Actions:

1. Check API error response.
2. Check logs for `S3 upload failed`.
3. Verify `/ready` S3 status.
4. Confirm the multipart field name is `documents`.
5. Confirm the upload targets exactly one entity.

### Signed Download URL Fails

Actions:

1. Confirm the document exists for the authenticated tenant.
2. Confirm `publicId` points to the S3 key.
3. Check `AWS_S3_SIGNED_URL_EXPIRES_IN`.
4. Confirm the bucket policy allows the application principal to read the object.
5. Generate a new URL if the old URL expired.

### Socket Notifications Are Missing

Actions:

1. Confirm the client supplies a valid JWT in socket auth.
2. Confirm API logs do not show socket auth failures.
3. Confirm the user and event are in the expected tenant.
4. Check whether the emitting service uses `emitTenantNotification` or `emitUserNotification`.
5. If horizontally scaling Socket.IO, add a Socket.IO Redis adapter before expecting cross-instance broadcasts.

## Maintenance Tasks

### Rotate JWT Secret

1. Deploy support for the new secret strategy if dual-secret rotation is required.
2. Update `JWT_SECRET`.
3. Restart API and socket-serving processes.
4. Expect existing access tokens to become invalid if no dual-secret strategy exists.
5. Consider revoking active refresh sessions if compromise is suspected.

### Rotate AWS Credentials

1. Create new least-privilege credentials or update the assigned IAM role.
2. Update deployment secrets.
3. Restart API and workers.
4. Check `/ready`.
5. Test document upload and signed download URL generation.
6. Disable old credentials.

### Clear Stuck Queue Jobs

Use BullMQ-aware tooling or scripts rather than deleting Redis keys manually. Before clearing jobs, record:

- queue name
- job IDs
- failure reason
- affected tenant IDs
- affected entity IDs

After clearing, decide whether to retry, mark domain records failed, or leave records unchanged.

## Logs To Watch

- `Server running`
- `MongoDB connected`
- `WebSocket server ready`
- `Order worker MongoDB connected`
- `Order worker connected to Redis`
- `Email worker MongoDB connected`
- `Email worker connected to Redis`
- `S3 upload failed`
- `S3 signed URL generation failed`
- `Order job failed`
- `Email job failed`

## Release Checklist

1. `npm run typecheck`
2. `npm run lint`
3. `npm test`
4. `npm run build`
5. Deploy API.
6. Deploy order worker.
7. Deploy email worker.
8. Check `/health` and `/ready`.
9. Smoke test auth, documents, orders, email, and notifications.
