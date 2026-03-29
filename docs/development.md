# Development Environment Setup

## Prerequisites

| Tool        | Version | Notes                                 |
|-------------|---------|---------------------------------------|
| Node.js     | v20+    | [nodejs.org](https://nodejs.org)      |
| PostgreSQL  | 15+     | Local instance or Docker              |
| Git         | any     |                                       |

---

## Quick Start

```bash
git clone https://github.com/ekky1328/SwiftCPQ.git
cd SwiftCPQ
```

SwiftCPQ has four services that each run in their own terminal:

| Service   | Directory     | Port | Purpose                                          |
|-----------|---------------|------|--------------------------------------------------|
| Server    | `server/`     | 5000 | Express API & serves built client in production  f|
| Client    | `client/`     | 5173 | Vue 3 SPA (dev only, Vite)                       |
| Templater | `templater/`  | 5005 | PDF generation microservice                      |
| Worker    | `server/`     | —    | Background job processor for supplier inventory  |

---

## 1. Database

Create a PostgreSQL database:

```sql
CREATE DATABASE swiftcpq_dev;
```

Or with `psql`:

```bash
psql -U postgres -c "CREATE DATABASE swiftcpq_dev;"
```

---

## 2. Server

```bash
cd server
cp .env.sample .env
```

Edit `.env` - the minimum required changes:

```env
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/swiftcpq_dev
JWT_SECRET=any-long-random-string
JWT_REFRESH_SECRET=another-long-random-string
INTERNAL_SERVICE_TOKEN=shared-secret-for-templater
```

Install dependencies, run migrations, and seed the database:

```bash
npm install
npm run migrate:up
npm run seed
```

Start the dev server:

```bash
npm run dev:server
```
Open server at http://localhost:5000

### Server Environment Variables

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

### Database Scripts

```bash
npm run migrate:up      # Apply all pending migrations
npm run migrate:down    # Roll back the last migration batch
npm run seed            # Seed initial tenant, user, and settings
```

The seed creates a default user: **michael.scott / password** (bcrypt-hashed).

---

## 3. Client

```bash
cd client
npm install
npm run dev
# → http://localhost:5173
```

The client proxies API requests to `http://localhost:5000` via the Vite dev server config. No `.env` file is required for local development unless you want to enable the dev-build banner:

```env
# client/.env.local (optional)
VITE_IS_DEV_BUILD=true
```

---

## 4. Templater

```bash
cd templater
cp .env.sample .env
```

Edit `.env`:

```env
MAIN_SERVER_URL=http://localhost:5000
INTERNAL_SERVICE_TOKEN=same-secret-as-server
```

`INTERNAL_SERVICE_TOKEN` must match the value in `server/.env`.

```bash
npm install
npm run dev
# → http://localhost:5005
```

### Templater Environment Variables

| Variable                | Required | Default                  | Description                                      |
|-------------------------|----------|--------------------------|--------------------------------------------------|
| `NODE_ENV`              | No       | `development`            | Node environment (`development` or `production`) |
| `MAIN_SERVER_URL`       | No       | `http://localhost:5000`  | URL of the main server API                       |
| `INTERNAL_SERVICE_TOKEN`| Yes      | -                        | Must match server's `INTERNAL_SERVICE_TOKEN`     |

### PDF Generation

The templater uses Puppeteer (headless Chromium) to generate PDFs. On first run, Puppeteer will download Chromium automatically (~170 MB) if it is not already cached.

If you're behind a proxy or in a restricted environment, set `PUPPETEER_SKIP_DOWNLOAD=true` and point `PUPPETEER_EXECUTABLE_PATH` to a local Chrome/Chromium binary.

---

## 5. Worker

The worker is a background job processor that handles supplier inventory ingestion. It lives in the same `server/` codebase but runs as a separate process controlled by the `MODE` environment variable:

- `MODE=1` (default) → HTTP server + frontend
- `MODE=0` → worker only (no HTTP listener)

Start the worker in development:

```bash
cd server
npm run dev:worker
```

The worker does two things on a recurring basis:

| Task                    | Interval (default)  | Description                                                                |
|-------------------------|---------------------|----------------------------------------------------------------------------|
| Job processing          | Every 5 seconds     | Claims `PENDING` rows from `ingestion_job`, runs the CSV ingestion pipeline, marks jobs `COMPLETED` or `FAILED` |
| Stale inventory cleanup | Once per day        | Soft-deletes supplier inventory rows and orphaned catalogue items older than the configured threshold |

Jobs are claimed atomically using `SELECT ... FOR UPDATE SKIP LOCKED`, so multiple worker instances can run safely in parallel without double-processing a job.

### Worker Environment Variables

The worker shares `server/.env`. The only worker-specific variables are:

| Variable                  | Required | Default             | Description                                         |
|---------------------------|----------|---------------------|-----------------------------------------------------|
| `MODE`                    | No       | `1`                 | Set to `0` to run as worker instead of HTTP server  |
| `DATABASE_URL`            | Yes      | —                   | PostgreSQL connection string (same as server)       |
| `WORKER_POLL_INTERVAL`    | No       | `5000`              | Milliseconds between job polling cycles             |
| `WORKER_CLEANUP_INTERVAL` | No       | `86400000` (1 day)  | Milliseconds between stale inventory cleanup runs   |

### Worker Docker Container

In production the worker runs in its own container built from `.docker/Dockerfile.worker`. It shares the same source tree as the server but sets `MODE=0` at the image level:

```dockerfile
ENV MODE=0
CMD ["npm", "run", "start:dist"]
```

Build and run it independently from the main server container so background processing does not compete with request handling.

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
├── client/          # Vue 3 SPA (Vite, PrimeVue 4, Pinia)
├── server/          # Express API + worker (TypeScript, Knex, PostgreSQL)
│   └── src/
│       ├── database/
│       │   └── migrations/   # SQL migration files
│       ├── server/
│       │   ├── api/          # Route handlers
│       │   ├── helpers/      # JWT, cookies, passwords
│       │   └── middlewares.ts
│       └── worker/           # Background job processor (MODE=0)
│           └── ingestion/    # CSV ingestion pipeline
├── templater/       # PDF microservice (Express, Puppeteer, EJS)
├── .docker/
│   ├── Dockerfile         # Production build (server + client, MODE=1)
│   └── Dockerfile.worker  # Worker-only container (MODE=0)
└── deploy.sh        # Example SSH deploy script
```

---

## Common Issues

**Port already in use**
Each service has a fixed port. Check for conflicting processes with `lsof -i :5000` (macOS/Linux) or `netstat -ano | findstr :5000` (Windows).

**Migration errors**
Ensure `DATABASE_URL` is correct and the database exists before running `migrate:up`. Run `migrate:down` to roll back a broken migration.

**Puppeteer fails to launch**
On Linux servers, install Chromium dependencies:
```bash
apt-get install -y libgbm-dev libxss1 libasound2 libatk-bridge2.0-0
```
See [Puppeteer troubleshooting](https://pptr.dev/troubleshooting) for the full list.

**401 errors in the browser**
The client and server must run on origins that match `CORS_ORIGIN`. In dev, keep the client on `http://localhost:5173` and the server on `http://localhost:5000`.
