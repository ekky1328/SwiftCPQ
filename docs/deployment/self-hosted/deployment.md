# Production Deployment (Self-Hosted / VM)

SwiftCPQ ships as three Docker containers:

| Container | Built from | Serves |
|-----------|-----------|--------|
| `swiftcpq` | `.docker/Dockerfile` | Express API + built Vue SPA on port 5000 |
| `swiftcpq-worker` | `.docker/Dockerfile.worker` | Background/ingestion worker (no HTTP, `MODE=0`) |
| `swiftcpq-templater` | `.docker/Dockerfile.templater` | PDF generation microservice on port 5005 |

The main container builds the Vue client and bundles it as static files served by Express, so you only need one public-facing port. The worker container runs the same server codebase in `MODE=0` — no HTTP server, no frontend — and is used to offload background work.

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

## 2. Environment File

The `.docker/docker-compose.yml` reads all configuration from a single `.env` file in the project root. Copy the example and fill in your values:

```bash
cp .env.example .env
```

Generate secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Key variables to change:

| Variable | Description |
|----------|-------------|
| `POSTGRES_PASSWORD` | Database password (also update in `DATABASE_URL`) |
| `DATABASE_URL` | Full connection string — host is `swiftcpq-postgres` inside Docker |
| `JWT_SECRET` | 64+ char random string for access tokens |
| `JWT_REFRESH_SECRET` | 64+ char random string for refresh tokens (different from above) |
| `CORS_ORIGIN` | Your public domain, e.g. `https://your-domain.com` |
| `INTERNAL_SERVICE_TOKEN` | Shared secret for service-to-service auth |

See `.env.example` for the full list including optional Entra ID variables.

---

## 3. Build and Run

### Option A: Docker Compose (recommended)

A `docker-compose.yml` is included in the `.docker/` directory. Copy the example environment file and fill in your values:

```bash
cp .env.example .env
# Edit .env with your database credentials, secrets, etc.
```

> Neither the worker nor the templater are exposed externally — they communicate with the main container over the Docker network.

Build and start:

```bash
docker compose --env-file .env -f .docker/docker-compose.yml up -d --build
```

Run migrations against the production database (once, or after each release):

```bash
docker exec swiftcpq pnpm run migrate:up
```

Seed initial data (first deploy only):

```bash
docker exec swiftcpq pnpm run seed
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

## 4. Building Individual Images

All Dockerfiles live in `.docker/` and use the repo root as their build context.

```bash
# Main app
docker build -f .docker/Dockerfile -t swiftcpq .

# Worker
docker build -f .docker/Dockerfile.worker -t swiftcpq-worker .

# Templater
docker build -f .docker/Dockerfile.templater -t swiftcpq-templater .
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
docker compose --env-file .env -f .docker/docker-compose.yml run --rm swiftcpq pnpm run migrate:up

# With standalone Docker
docker exec swiftcpq pnpm run migrate:up
```

To roll back the last batch:

```bash
docker exec swiftcpq pnpm run migrate:down
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
3. Rebuild the containers: `docker compose --env-file .env -f .docker/docker-compose.yml up -d --build`
4. Run migrations: `docker exec swiftcpq pnpm run migrate:up`
