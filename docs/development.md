# Development Environment Setup

## Prerequisites

| Tool       | Version | Notes                                                    |
|------------|---------|----------------------------------------------------------|
| Node.js    | v22+    | [nodejs.org](https://nodejs.org)                         |
| pnpm       | 10+     | `corepack enable` to activate                            |
| Docker     | 24+     | [docker.com](https://www.docker.com/get-started) — used for PostgreSQL |
| Git        | any     |                                                          |

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/ekky1328/SwiftCPQ.git
cd SwiftCPQ
pnpm install   # installs all workspace packages
```

### 2. Start PostgreSQL

The project includes a dev-only Docker Compose file that runs PostgreSQL with sensible defaults — no manual database configuration required.

```bash
docker compose -f .docker/docker-compose.dev.yml up -d
```

This starts a PostgreSQL 16 container with:

| Setting             | Value                |
|---------------------|----------------------|
| Host                | `localhost`          |
| Port                | `5432`               |
| User                | `swiftcpq`           |
| Password            | `swiftcpq`           |
| Database            | `swiftcpq_dev`       |
| Connection string   | `postgres://swiftcpq:swiftcpq@localhost:5432/swiftcpq_dev` |

Data is persisted in a Docker volume (`pgdata_dev`), so it survives container restarts.

To stop the database:

```bash
docker compose -f .docker/docker-compose.dev.yml down
```

To stop **and delete all data** (fresh start):

```bash
docker compose -f .docker/docker-compose.dev.yml down -v
```

### 3. Configure environment files

Copy the sample environment files:

```bash
cp server/.server.env.sample server/.env
cp templater/.env.sample templater/.env
```

The defaults in each sample file are pre-configured to work with the dev Docker Compose database. Review and adjust if needed:

**`server/.env`** — minimum required changes:

```env
DATABASE_URL=postgres://swiftcpq:swiftcpq@localhost:5432/swiftcpq_dev
JWT_SECRET=any-long-random-string
JWT_REFRESH_SECRET=another-long-random-string
INTERNAL_SERVICE_TOKEN=shared-secret-for-templater
```

**`templater/.env`** — ensure the service token matches:

```env
MAIN_SERVER_URL=http://localhost:5000
INTERNAL_SERVICE_TOKEN=shared-secret-for-templater
```

`INTERNAL_SERVICE_TOKEN` **must** be the same value in both files.

### 4. Run migrations and seed

```bash
pnpm run db:setup
```

This applies all pending database migrations and seeds the initial tenant, user, and settings. The seed creates a default user: **michael.scott / password** (bcrypt-hashed).

You can also run these individually:

```bash
pnpm run migrate:up    # apply migrations only
pnpm run seed          # seed data only
pnpm run migrate:down  # roll back the last migration batch
```

### 5. Start all services

```bash
pnpm run dev
```

This single command starts **all four services** concurrently with hot reloading:

| Service   | Port | Label (in terminal) | Purpose                                         |
|-----------|------|---------------------|-------------------------------------------------|
| Server    | 5000 | `[server]`          | Express API                                     |
| Client    | 5173 | `[client]`          | Vue 3 SPA (Vite dev server)                     |
| Templater | 5005 | `[templater]`       | PDF generation microservice                     |
| Worker    | —    | `[worker]`          | Background job processor for supplier inventory |

Each service is colour-coded in the terminal output. Press `Ctrl+C` to stop all services at once.

Open the app at **http://localhost:5173** (client dev server with API proxy to `:5000`).

### Running individual services

If you only need specific services, run them individually from the root:

```bash
pnpm run dev:server     # Express API only (port 5000)
pnpm run dev:client     # Vue SPA only (port 5173)
pnpm run dev:templater  # PDF service only (port 5005)
pnpm run dev:worker     # Background worker only
```

---

## Server Environment Variables

| Variable                | Required | Default                                          | Description                                                        |
|-------------------------|----------|--------------------------------------------------|--------------------------------------------------------------------|
| `NODE_ENV`              | No       | `development`                                    | Set to `production` in prod                                        |
| `DATABASE_URL`          | Yes      | -                                                | PostgreSQL connection string                                       |
| `JWT_SECRET`            | Yes      | -                                                | Signs access tokens (15 min expiry)                                |
| `JWT_REFRESH_SECRET`    | Yes      | -                                                | Signs refresh tokens (7 day expiry)                                |
| `CORS_ORIGIN`           | No       | http://localhost:5173                            | Allowed frontend origin                                            |
| `INTERNAL_SERVICE_TOKEN`| Yes      | -                                                | Shared secret for service-to-service calls                         |
| `TEMPLATER_URL`         | No       | http://localhost:5005                            | URL of the templater service                                       |
| `ENTRA_CLIENT_ID`       | No       | -                                                | Azure app registration client ID                                   |
| `ENTRA_CLIENT_SECRET`   | No       | -                                                | Azure app registration client secret                               |
| `ENTRA_TENANT_ID`       | No       | -                                                | Azure tenant ID                                                    |
| `ENTRA_REDIRECT_URI`    | No       | http://localhost:5000/api/v1/auth/entra/callback | OAuth callback URL registered in Azure                             |

## Templater Environment Variables

| Variable                | Required | Default                  | Description                                      |
|-------------------------|----------|--------------------------|--------------------------------------------------|
| `NODE_ENV`              | No       | `development`            | Node environment (`development` or `production`) |
| `MAIN_SERVER_URL`       | No       | `http://localhost:5000`  | URL of the main server API                       |
| `INTERNAL_SERVICE_TOKEN`| Yes      | -                        | Must match server's `INTERNAL_SERVICE_TOKEN`     |

## Worker Environment Variables

The worker shares `server/.env`. The only worker-specific variables are:

| Variable                  | Required | Default             | Description                                         |
|---------------------------|----------|---------------------|-----------------------------------------------------|
| `MODE`                    | No       | `1`                 | Set to `0` to run as worker instead of HTTP server  |
| `DATABASE_URL`            | Yes      | —                   | PostgreSQL connection string (same as server)       |
| `WORKER_POLL_INTERVAL`    | No       | `5000`              | Milliseconds between job polling cycles             |
| `WORKER_CLEANUP_INTERVAL` | No       | `86400000` (1 day)  | Milliseconds between stale inventory cleanup runs   |

---

## PDF Generation

The templater uses Puppeteer (headless Chromium) to generate PDFs. On first run, Puppeteer will download Chromium automatically (~170 MB) if it is not already cached.

If you're behind a proxy or in a restricted environment, set `PUPPETEER_SKIP_DOWNLOAD=true` and point `PUPPETEER_EXECUTABLE_PATH` to a local Chrome/Chromium binary.

---

## Worker

The worker is a background job processor that handles supplier inventory ingestion. It lives in the same `server/` codebase but runs as a separate process controlled by the `MODE` environment variable:

- `MODE=1` (default) — HTTP server + frontend
- `MODE=0` — worker only (no HTTP listener)

The worker performs two recurring tasks:

| Task                    | Interval (default)  | Description                                                                |
|-------------------------|---------------------|----------------------------------------------------------------------------|
| Job processing          | Every 5 seconds     | Claims `PENDING` rows from `ingestion_job`, runs the CSV ingestion pipeline, marks jobs `COMPLETED` or `FAILED` |
| Stale inventory cleanup | Once per day        | Soft-deletes supplier inventory rows and orphaned catalogue items older than the configured threshold |

Jobs are claimed atomically using `SELECT ... FOR UPDATE SKIP LOCKED`, so multiple worker instances can run safely in parallel without double-processing a job.

---

## Microsoft Entra ID (Optional)

To test Entra login locally:

1. Register an app in [Azure Portal](https://portal.azure.com) → Entra ID → App registrations
2. Add a redirect URI: `http://localhost:5000/api/v1/auth/entra/callback`
3. Create a client secret under **Certificates & secrets**
4. Fill in `server/.env`:

```env
ENTRA_CLIENT_ID=your-application-client-id
ENTRA_CLIENT_SECRET=your-client-secret
ENTRA_TENANT_ID=your-tenant-id
ENTRA_REDIRECT_URI=http://localhost:5000/api/v1/auth/entra/callback
```

When `ENTRA_CLIENT_ID` is set, the login page will show a "Sign in with Microsoft" button in addition to the local username/password form.

---

## Project Structure

```
SwiftCPQ/
├── client/                     # Vue 3 SPA (Vite, PrimeVue 4, Pinia)
├── server/                     # Express Server + Worker (TypeScript, Knex w/ PG)
│   └── src/
│       ├── database/
│       │   └── migrations/     
│       ├── server/             # API Server (MODE=1)
│       │   ├── api/            
│       │   ├── helpers/        
│       │   └── middlewares.ts
│       └── worker/             # Background job processor (MODE=0)
│           └── ingestion/      # CSV ingestion pipeline
├── templater/                  # PDF microservice (Express, Puppeteer, EJS)
├── .docker/
│   ├── Dockerfile              # Production build (server + client, MODE=1)
│   ├── Dockerfile.worker       # Worker-only container (MODE=0)
│   └── Dockerfile.templater    # PDF service container
│   ├── docker-compose.yml      # Production Docker Compose
│   └── docker-compose.dev.yml  # Development Docker Compose (PostgreSQL only)
└── deploy.sh                   # Example SSH deploy script
```

---

## Common Issues

**Port already in use**
Each service has a fixed port. Check for conflicting processes with `lsof -i :5000` (macOS/Linux) or `netstat -ano | findstr :5000` (Windows).

**Migration errors**
Ensure PostgreSQL is running (`docker compose -f .docker/docker-compose.dev.yml ps`) and `DATABASE_URL` in `server/.env` is correct. Run `pnpm run migrate:down` to roll back a broken migration.

**Puppeteer fails to launch**
On Linux servers, install Chromium dependencies:
```bash
apt-get install -y libgbm-dev libxss1 libasound2 libatk-bridge2.0-0
```
See [Puppeteer troubleshooting](https://pptr.dev/troubleshooting) for the full list.

**401 errors in the browser**
The client and server must run on origins that match `CORS_ORIGIN`. In dev, keep the client on `http://localhost:5173` and the server on `http://localhost:5000`.

**Docker permission issues on Linux**
If `docker compose` fails with permission errors, either add your user to the `docker` group (`sudo usermod -aG docker $USER`, then log out and back in) or prefix commands with `sudo`.
