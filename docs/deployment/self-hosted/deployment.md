# Production Deployment (Self-Hosted / VM)

SwiftCPQ ships as two Docker containers:

| Container | Built from | Serves |
|-----------|-----------|--------|
| `swiftcpq` | `Dockerfile` (root) | Express API + built Vue SPA on port 5000 |
| `swiftcpq-templater` | `templater/Dockerfile` | PDF generation microservice on port 5005 |

The main container builds the Vue client and bundles it as static files served by Express, so you only need one public-facing port.

> For deploying to Azure, see [../azure/deployment-azure.md](../azure/deployment-azure.md).

---

## Prerequisites

- Docker 24+
- PostgreSQL 15+ (external — not included in the Docker image)
- A reverse proxy (nginx or Caddy recommended) for TLS termination

---

## 1. PostgreSQL

Provision a PostgreSQL 15+ database. The connection string format is:

```
postgres://USER:PASSWORD@HOST:5432/swiftcpq
```

If you're running PostgreSQL on the same host as Docker, use `host.docker.internal` (Docker Desktop) or the host's LAN IP instead of `localhost`.

---

## 2. Environment Files

### `server/.env` (production)

```env
NODE_ENV=production
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/swiftcpq

JWT_SECRET=<64+ char random string>
JWT_REFRESH_SECRET=<64+ char random string, different from JWT_SECRET>

CORS_ORIGIN=https://your-domain.com
INTERNAL_SERVICE_TOKEN=<random string, shared with templater>

TEMPLATER_URL=http://swiftcpq-templater:5005

# Leave blank to disable Entra
ENTRA_CLIENT_ID=
ENTRA_CLIENT_SECRET=
ENTRA_TENANT_ID=
ENTRA_REDIRECT_URI=https://your-domain.com/api/v1/auth/entra/callback
```

Generate secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### `templater/.env` (production)

```env
NODE_ENV=production
MAIN_SERVER_URL=http://swiftcpq:5000
INTERNAL_SERVICE_TOKEN=<same value as server INTERNAL_SERVICE_TOKEN>
```

---

## 3. Build and Run

### Option A: Docker Compose (recommended)

Create `docker-compose.yml` in the project root:

```yaml
services:
  swiftcpq:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: swiftcpq
    env_file: server/.env
    ports:
      - "5000:5000"
    volumes:
      - ./data:/server/dist/data
    restart: unless-stopped

  swiftcpq-templater:
    build:
      context: ./templater
      dockerfile: Dockerfile
    container_name: swiftcpq-templater
    env_file: templater/.env
    restart: unless-stopped
```

> The templater is not exposed externally — it communicates with the main container over the Docker network.

Build and start:

```bash
docker compose up -d --build
```

Run migrations against the production database (once, or after each release):

```bash
docker exec swiftcpq npm run migrate:up
```

Seed initial data (first deploy only):

```bash
docker exec swiftcpq npm run seed
```

---

### Option B: Manual Docker (deploy.sh)

The included `deploy.sh` builds and deploys the main container to a remote host over SSH. Adapt the variables at the top of the file:

```bash
user=your-ssh-user
host=your-server-ip
```

Then run:

```bash
./deploy.sh
```

The script:
1. Archives the repo with `git archive`
2. Copies the archive and `.env` to the remote host
3. SSH's in, extracts, builds, and starts the container

You'll need to deploy the templater container separately, or extend the script to handle it.

---

## 4. Templater Dockerfile

The `templater/` directory does not currently ship a `Dockerfile`. Create one:

```dockerfile
FROM node:20-slim

# Chromium dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libgbm-dev \
    libxss1 \
    libasound2 \
    libatk-bridge2.0-0 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .
RUN npm run build

EXPOSE 5005
CMD ["npm", "run", "start:dist"]
```

Build and run:

```bash
docker build -t swiftcpq-templater ./templater
docker run -d \
  --name swiftcpq-templater \
  --env-file templater/.env \
  --restart unless-stopped \
  swiftcpq-templater
```

---

## 5. Reverse Proxy (nginx)

Point your domain at port 5000. Example nginx config with TLS via Let's Encrypt:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    client_max_body_size 20M;

    location / {
        proxy_pass         http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

Do not expose port 5005 (templater) publicly — it uses a shared secret and has no user-facing auth.

---

## 6. Running Migrations in Production

Always run migrations before starting a new release:

```bash
# With Docker Compose
docker compose run --rm swiftcpq npm run migrate:up

# With standalone Docker
docker exec swiftcpq npm run migrate:up
```

To roll back the last batch:

```bash
docker exec swiftcpq npm run migrate:down
```

---

## 7. Microsoft Entra ID (optional)

1. Register an app in [Azure Portal](https://portal.azure.com) → Entra ID → App registrations
2. Set the redirect URI to `https://your-domain.com/api/v1/auth/entra/callback`
3. Create a client secret under **Certificates & secrets**
4. Add to `server/.env`:

```env
ENTRA_CLIENT_ID=your-application-client-id
ENTRA_CLIENT_SECRET=your-client-secret
ENTRA_TENANT_ID=your-tenant-id
ENTRA_REDIRECT_URI=https://your-domain.com/api/v1/auth/entra/callback
```

When `ENTRA_CLIENT_ID` is populated, the login page will show a "Sign in with Microsoft" button alongside (or instead of) the local login form.

---

## 8. Health Check

The server exposes no dedicated `/health` endpoint yet. A simple check:

```bash
curl -f http://localhost:5000/api/v1/auth/config
# Expected: {"local":true,"entra":false}
```

Use this in your uptime monitor or Docker healthcheck config.

---

## 9. Upgrade Process

1. Pull the latest code
2. Review any new `.env.sample` entries and add them to your `.env`
3. Rebuild the containers: `docker compose up -d --build`
4. Run migrations: `docker exec swiftcpq npm run migrate:up`
