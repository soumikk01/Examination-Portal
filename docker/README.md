# Servers to run & Docker commands

## How many servers?

You need **4 processes** (3 apps + 1 optional):

| # | Service        | Purpose              | Port (typical) | Required |
|---|----------------|----------------------|----------------|----------|
| 1 | **Backend API** | Express + Prisma API | 8787           | Yes      |
| 2 | **Student web** | Student portal (Vite) | 5173          | Yes      |
| 3 | **Admin web**   | Admin panel (Vite)   | 5174          | Yes      |
| 4 | **Redis**       | Caching / rate limit | 6379          | Optional |

- **Database**: Data is in **Supabase** (PostgreSQL). No local DB server; set `DATABASE_URL` and `DIRECT_URL` in `backend/.env`.
- **Redis**: If `REDIS_URL` is not set or Redis is down, the API still runs (with in-memory fallback where applicable).

---

## Run without Docker (local dev)

From repo root:

```bash
# Terminal 1 – Backend
npm run server

# Terminal 2 – Student portal
npm run client

# Terminal 3 – Admin panel
npm run admin
```

Optional Redis (e.g. with Docker):

```bash
docker run -d -p 6379:6379 redis:alpine
```

Then set in `backend/.env`:

```env
REDIS_URL=redis://localhost:6379
```

Or run backend + student app together:

```bash
npm run dev
```

Then run admin in another terminal: `npm run admin`.

---

## Run with Docker

All commands are from the **repo root** unless noted.

### Production-style (all in Docker)

```bash
cd docker
docker compose -f docker-compose.yml up -d
```

Services:

- **API**: http://localhost:8787  
- **Student web**: http://localhost:80 (or http://localhost)  
- **Admin web**: http://localhost:8080  
- **Redis**: internal (port 6379 exposed if needed)

You must provide `DATABASE_URL` and `DIRECT_URL` (Supabase) for the API, e.g. via `backend/.env` or env in compose (see below).

### Development (hot reload)

```bash
cd docker
docker compose -f docker-compose.dev.yml up -d
```

- **API**: http://localhost:8787  
- **Student web**: http://localhost:5173  

Admin is not in the dev compose; run it locally: `npm run admin`.

For a **detailed explanation** of each command (what each flag does, when to use it), see [DOCKER_COMMANDS.md](./DOCKER_COMMANDS.md).

### Useful Docker commands

```bash
# Build and start (from repo root, docker folder as context)
docker compose -f docker/docker-compose.yml up -d --build

# View logs
docker compose -f docker/docker-compose.yml logs -f

# Stop
docker compose -f docker/docker-compose.yml down

# Stop and remove volumes
docker compose -f docker/docker-compose.yml down -v
```

---

## Backend env for Docker

The API needs at least:

- `DATABASE_URL` – Supabase pooled URL (port 6543)
- `DIRECT_URL` – Supabase direct URL (port 5432), for migrations/seed

In Docker, Redis is the `redis` service, so:

- `REDIS_URL=redis://redis:6379`

Options:

1. **Env file**: Create `backend/.env` with `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL=redis://redis:6379`, and use `env_file: ../backend/.env` for the `api` service (see `docker-compose.yml`).
2. **Inline in compose**: Set `environment` for the `api` service (avoid putting real secrets in the file; use a secrets manager in production).

After first deploy, run migrations/seed once (e.g. on host or a one-off container):

```bash
cd backend
npx prisma generate
npx prisma db push
npm run db:seed
```
