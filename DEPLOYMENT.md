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
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/backend-saas?retryWrites=false
MONGO_USE_TRANSACTIONS=false
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:3000,http://localhost:5173
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=your-bucket
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

- `backend`: API process exposed as host `5001` to container `5001`.
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
MONGO_URI=mongodb://mongo:27017/backend-saas?retryWrites=false
MONGO_USE_TRANSACTIONS=false
REDIS_HOST=redis
```

## AWS EC2 Free Tier

Use this path for an always-on deployment on an AWS EC2 Ubuntu instance. A free-tier account can run an eligible small instance for the free-tier period, but you should still watch billing, Elastic IP usage, EBS storage, S3, and data transfer.

### 1. Create the EC2 Instance

In AWS:

1. Open EC2 and launch an Ubuntu Server instance.
2. Choose a free-tier eligible instance type, such as `t2.micro` or `t3.micro` when it is available in your region/account.
3. Create or select an SSH key pair and download the `.pem` file.
4. Use a security group that allows inbound TCP:
   - `22` from your IP for SSH.
   - `5001` from the internet only if exposing the API directly.
   - `80` and `443` if using Nginx and HTTPS.
5. Allocate and associate an Elastic IP if you want a stable public IP.

Do not open MongoDB `27017` or Redis `6379` publicly. The EC2 compose file does not run MongoDB when using Atlas, and Redis stays internal to Docker.

### 2. Install Docker On The VM

SSH into the VM:

```bash
chmod 400 /path/to/your-key.pem
ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

Install Docker:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu
```

Log out and SSH back in so the Docker group permission applies.

### 3. Upload Or Clone The App

Clone the repository:

```bash
git clone YOUR_REPO_URL backendSaas
cd backendSaas
```

If the repository is private, configure SSH deploy keys or clone using your authenticated Git provider flow.

### 4. Configure Production Environment

Create the production env file:

```bash
cp .env.example .env
nano .env
```

Generate a strong JWT secret:

```bash
openssl rand -base64 48
```

Set at least:

```bash
NODE_ENV=production
PORT=5001
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/backendSaas
MONGO_USE_TRANSACTIONS=true
JWT_SECRET=generated-secret
CLIENT_URL=https://your-frontend-domain.com
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=your-bucket
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
REDIS_HOST=redis
REDIS_PORT=6379
```

For MongoDB Atlas, add the EC2 public IP in Atlas Network Access. For initial testing you may temporarily allow access from anywhere, but the safer long-term setup is to allow only the EC2 public IP or use private networking. Encode special characters in the MongoDB username or password before placing them in `MONGO_URI`.

The EC2 compose file reads `.env` for `MONGO_URI`; it does not run or override MongoDB locally.

### 5. Start The Backend

Build and start API, workers, and Redis:

```bash
docker compose -f docker-compose.ec2.yml up -d --build
```

Check running containers:

```bash
docker compose -f docker-compose.ec2.yml ps
```

Watch logs:

```bash
docker compose -f docker-compose.ec2.yml logs -f backend
docker compose -f docker-compose.ec2.yml logs -f order-worker
docker compose -f docker-compose.ec2.yml logs -f email-worker
```

Verify from the VM:

```bash
curl http://localhost:5001/health
curl http://localhost:5001/ready
```

Verify from your machine:

```bash
curl http://YOUR_EC2_PUBLIC_IP:5001/health
```

If the VM responds locally but not publicly, check the EC2 security group inbound rules, network ACLs, and the VM firewall:

```bash
sudo ufw status
sudo iptables -L -n
```

### 6. Optional Domain And HTTPS

Point your domain DNS `A` record to the EC2 public IP or Elastic IP, then install Nginx and Certbot:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Create an Nginx site:

```nginx
server {
  listen 80;
  server_name api.your-domain.com;

  location / {
    proxy_pass http://127.0.0.1:5001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

Enable it:

```bash
sudo nano /etc/nginx/sites-available/backend-saas
sudo ln -s /etc/nginx/sites-available/backend-saas /etc/nginx/sites-enabled/backend-saas
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d api.your-domain.com
```

After HTTPS is live, set your frontend API base URL to `https://api.your-domain.com`.

### 7. Updates

Deploy a new version:

```bash
git pull
docker compose -f docker-compose.ec2.yml up -d --build
docker image prune -f
```

Backup local MongoDB data before risky changes:

```bash
docker exec saas-mongo mongodump --archive=/tmp/backend-saas.archive
docker cp saas-mongo:/tmp/backend-saas.archive ./backend-saas.archive
```

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | Recommended | HTTP port. Use `5001` for the provided EC2 compose file; code fallback is `5001`. |
| `NODE_ENV` | Recommended | Use `production` in production. |
| `LOG_LEVEL` | No | Pino log level. Defaults to `info`. |
| `MONGO_URI` | Yes | MongoDB connection string. Use a MongoDB Atlas SRV URI in EC2, for example `mongodb+srv://username:password@cluster.mongodb.net/backendSaas`. |
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
| `AWS_S3_BUCKET_NAME` | Yes for S3 | Bucket used for documents and attachments. |
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
