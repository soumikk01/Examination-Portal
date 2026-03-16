# Docker commands explained

This file explains each Docker Compose command used for this project. All paths assume you are at the **repo root** unless stated otherwise.

---

## Starting the stack

### From repo root

```bash
docker compose -f docker/docker-compose.yml up -d
```

| Part | Meaning |
|------|--------|
| **docker compose** | Docker Compose: builds and runs multi-container apps from a compose file. |
| **-f docker/docker-compose.yml** | Use this compose file. `-f` = “file”. Path is relative to the repo root. |
| **up** | Create and start all services in that file (api, student-web, admin-web, redis). |
| **-d** | Run in the **background** (detached). Containers keep running; your terminal is free. Without `-d`, logs would stream in the terminal. |

**When to use:** Run this when you are in the project root (e.g. `c:\Users\soumi\Examination-Portal-3`).

---

### From the docker folder

```bash
docker compose -f docker-compose.yml up -d
```

Same as above, but the file path is **relative to the current directory**. Use this when you have already run `cd docker`.

---

## Fixing "container name already in use"

If you see an error like:  
*The container name "/exam-portal-redis" is already in use by container "..."*

you can fix it in one of two ways.

---

### Option 1: Remove only the conflicting container

```bash
docker rm -f exam-portal-redis
```

| Part | Meaning |
|------|--------|
| **docker rm** | Remove a container. |
| **-f** | **Force**: stop the container if it is running, then remove it. Without `-f`, Docker will not remove a running container. |
| **exam-portal-redis** | The name of the container to remove (the Redis container from this project). |

**When to use:** When only one container (e.g. Redis) is conflicting and you want to remove just that one, then run `docker compose ... up -d` again.

---

### Option 2: Tear down the whole stack and start fresh

```bash
docker compose -f docker/docker-compose.yml down
docker compose -f docker/docker-compose.yml up -d
```

**First command — `down`:**

| Part | Meaning |
|------|--------|
| **docker compose** | Same Compose tool. |
| **-f docker/docker-compose.yml** | Same compose file (from repo root). |
| **down** | Stop and **remove** all containers (and networks) created by that compose file. Volumes are **not** removed by default. |

**When to use:** When you want to stop and remove the **entire** exam-portal stack (api, student-web, admin-web, redis) so the next `up -d` creates everything from scratch with no name conflicts.

**Second command:** Starts the stack again (see “Starting the stack” above).

---

## Other useful commands

### Build and start (rebuild images)

```bash
docker compose -f docker/docker-compose.yml up -d --build
```

**--build** — Force rebuild of images before starting. Use when you changed Dockerfile or app code and want fresh images.

---

### View logs

```bash
docker compose -f docker/docker-compose.yml logs -f
```

**logs** — Show logs from all services. **-f** — Follow (stream) logs; press Ctrl+C to stop.

---

### Stop the stack (keep containers for next start)

```bash
docker compose -f docker/docker-compose.yml stop
```

Containers remain; use `docker compose -f docker/docker-compose.yml start` to start them again.

---

### Stop and remove containers

```bash
docker compose -f docker/docker-compose.yml down
```

Stops and removes containers and networks. Does **not** remove volumes by default.

---

### Stop and remove containers and volumes

```bash
docker compose -f docker/docker-compose.yml down -v
```

**-v** — Also remove **volumes** defined in the compose file. Use when you want a full cleanup. This project does not store critical data in Docker volumes (database is Supabase), so `-v` is optional.

---

## Quick reference

| Goal | Command (from repo root) |
|------|---------------------------|
| Start stack in background | `docker compose -f docker/docker-compose.yml up -d` |
| Start stack (when in `docker` folder) | `docker compose -f docker-compose.yml up -d` |
| Remove only Redis container | `docker rm -f exam-portal-redis` |
| Stop and remove entire stack | `docker compose -f docker/docker-compose.yml down` |
| Full reset then start | `docker compose -f docker/docker-compose.yml down` then `docker compose -f docker/docker-compose.yml up -d` |
| Rebuild and start | `docker compose -f docker/docker-compose.yml up -d --build` |
| View logs | `docker compose -f docker/docker-compose.yml logs -f` |
