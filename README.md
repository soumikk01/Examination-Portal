# 📚 Examination Portal

<div align="center">

**A modern, secure web application for managing student examination schedules.**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-20+-green.svg)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/docker-ready-brightgreen.svg)](https://docker.com)
[![React](https://img.shields.io/badge/react-18+-61dafb.svg)](https://react.dev)
[![Express](https://img.shields.io/badge/express-4.x-black.svg)](https://expressjs.com)

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Documentation](#-documentation)
- [Backend](#-backend)
- [Backend Security](#-backend-security)
- [Frontend](#-frontend)
- [Project Structure](#-project-structure)
- [Run Commands](#-run-commands)
- [Tech Stack](#️-tech-stack)
- [API Reference](#-api-reference)
- [Code Quality & CI/CD](#-code-quality--cicd)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Core

| Feature | Description |
|--------|-------------|
| 🔍 **Student Search** | Search by College ID or name with auto-formatting |
| 📅 **Exam Schedule** | Upcoming and past exams with date filtering |
| 📊 **Exam Filters** | Filter by type (ODD, EVEN, TEST-I, TEST-II) |
| 📱 **Responsive** | Mobile, tablet, and desktop support |

### UI/UX

| Feature | Description |
|--------|-------------|
| 🌈 **Modern Design** | Gradients, glass morphism, Lucide icons |
| ⏳ **Skeleton Loading** | Smooth loading states |
| 📌 **Notices** | Pinned exam instructions |
| 🏷️ **Paper Details** | Paper Name and Code displayed clearly |
| ✅ **Exam Status** | Upcoming vs completed distinction |
| 🎉 **Completion Message** | Celebration when all exams are done |

---

## 📚 Documentation

All project documentation is centralized here. Use these guides for setup, deployment, and operations.

| Document | Location | Purpose |
|----------|----------|---------|
| **Supabase setup** | [backend/SUPABASE_SETUP.md](backend/SUPABASE_SETUP.md) | Step-by-step: connect to Supabase, create `.env`, run migrations and seed. Use after cloning or for first-time DB setup. |
| **Database options** | [backend/DATABASE.md](backend/DATABASE.md) | PostgreSQL (Supabase), MySQL, or self-hosted; data flow and table roles. |
| **Production deployment** | [backend/PRODUCTION.md](backend/PRODUCTION.md) | Production checklist: env vars, Supabase, backend, frontends, security. |
| **Docker (servers & commands)** | [docker/README.md](docker/README.md) | How many servers to run, local vs Docker, ports, backend env for containers. |
| **Docker commands explained** | [docker/DOCKER_COMMANDS.md](docker/DOCKER_COMMANDS.md) | What each Docker Compose command and flag does; fixing container conflicts. |
| **Security & code audit** | [SECURITY_AND_CODE_AUDIT.md](SECURITY_AND_CODE_AUDIT.md) | Security review, recommendations, and audit notes. |

**Quick links**

- **I just cloned** → [SUPABASE_SETUP.md](backend/SUPABASE_SETUP.md) (get DB working).
- **Deploy to production** → [PRODUCTION.md](backend/PRODUCTION.md).
- **Run with Docker** → [docker/README.md](docker/README.md) and [DOCKER_COMMANDS.md](docker/DOCKER_COMMANDS.md).

---

## 🔧 Backend

The API is built with **Express.js**, **Prisma** (PostgreSQL via Supabase), and **Redis**, designed for reliability and security.

### Backend Features

| Area | Description |
|------|-------------|
| **Auth** | Student login (College ID + last 3 digits of roll), Admin login (email + bcrypt password), JWT (8h expiry), session invalidation on re-login |
| **Data** | Students, Exams, Rooms, Seating; Prisma ORM with PostgreSQL (Supabase); optional Redis for caching |
| **Health** | `GET /api/v1/health` reports database and Redis status (UP/DEGRADED) |
| **Validation** | Zod schemas for all auth and student registration inputs |
| **Logging** | Pino with request IDs, level by status, redaction of secrets |
| **Errors** | Central error handler; generic messages in production; request IDs in responses |

### Why the Backend Is Strong

- **Modular layout** — Routes and logic live under `src/modules/` (auth, students, exams, rooms, seating) with clear separation of controller/service.
- **Config from env** — Port, DB, Redis, JWT secret, admin key, and CORS origins are validated at startup via Zod; invalid config fails fast.
- **Strict validation** — Every mutation uses a Zod schema; invalid payloads get 400 with structured error details.
- **Auth boundaries** — Student profile requires JWT + `collegeId` match; admin routes support Bearer JWT or `X-Admin-Key`; session IDs prevent token reuse after re-login.
- **Production-ready** — Helmet, CORS allowlist, rate limiting, compression, and graceful shutdown on SIGTERM/SIGINT.

---

## 🔒 Backend Security

| Layer | Implementation |
|-------|----------------|
| **Helmet** | Security headers: CSP, `referrer-policy: same-origin` |
| **CORS** | Allowlist only: `CORS_ORIGIN` (comma-separated); no wildcard |
| **Rate limiting** | `express-rate-limit`: 100 requests per 15 minutes per IP |
| **Authentication** | JWT for students and admins; students: College ID + 3-digit verification; admins: email + bcrypt; 8h expiry |
| **Session invalidation** | Stored `sessionId` per student; token includes it; re-login issues new session and invalidates old token |
| **Authorization** | Student: `verifyToken` + `authorizeStudent` (collegeId must match). Admin: `authorizeAdmin` (JWT with `role: admin` or valid `X-Admin-Key`) |
| **Input validation** | Zod schemas for `/auth/login`, `/auth/admin/login`, `POST /student`; invalid exam IDs (e.g. NaN) return 400 |
| **Secrets** | No hardcoded secrets; `JWT_SECRET`, `ADMIN_API_KEY`, `DATABASE_URL` from env; `.env` in `.gitignore` |
| **Logging** | Pino redacts `authorization`, `cookie`, `verification`, `password`, `sessionId`, etc. |
| **Error handling** | No stack or internal messages in production; generic “Internal server error”; Prisma errors mapped to 400 with request ID |
| **Request tracing** | UUID per request; `X-Request-Id` on response for debugging |

See [SECURITY_AND_CODE_AUDIT.md](SECURITY_AND_CODE_AUDIT.md) for audit notes and recommendations.

---

## 🖥️ Frontend

### Student Web (`apps/student-web`)

Public-facing app for students to search and view their exam schedule.

| Aspect | Details |
|--------|--------|
| **Stack** | React 18, Vite 5, Tailwind CSS 4, Framer Motion, Lucide React, React Router 7, Axios |
| **Pages** | Search (by College ID) → Profile (exam list, filters, notices) |
| **API** | `VITE_API_URL` (default `/api` in dev; Vite proxies to backend). Token stored and sent as `Authorization: Bearer <token>`. |
| **UX** | Skeleton loaders, responsive layout, exam cards with date/time/room, completion state |

**Structure:** `src/` — `App.jsx`, `main.jsx`, `pages/` (SearchPage, ProfilePage), `components/` (Button, Card, ExamCard, PageLayout, Skeleton, etc.), `services/api.js`, `styles/`, `utils/`, `test/`.

### Admin Web (`apps/admin-web`)

Dashboard for staff to manage students, exams, rooms, and seating.

| Aspect | Details |
|--------|--------|
| **Stack** | React 18, Vite 5, React Router 7, Axios, Lucide React |
| **Pages** | Login (email + password → JWT), Dashboard, Students, Exams, Rooms, Seating |
| **API** | `VITE_ADMIN_API_URL`; sends `Authorization: Bearer <token>` after login, or `X-Admin-Key` when configured |
| **Auth** | Login calls `POST /api/v1/auth/admin/login`; token stored and used for protected routes |

**Structure:** `src/` — `App.jsx`, `main.jsx`, `pages/` (Login, Dashboard, Students, Exams, Rooms, Seating), `components/` (AdminLayout, ProtectedRoute), `services/api.js`, `styles/`.

### How Frontends Connect to Backend

| App | Port | Proxy / Base URL |
|-----|------|------------------|
| **Student web** | 5173 | `/api` → `http://localhost:8787` (Vite proxy) |
| **Admin web** | 5174 | `/api` → `http://localhost:8787` (Vite proxy) |
| **Backend** | 8787 | Serves `/api/v1/*`; CORS allows 5173 and 5174 (configurable via `CORS_ORIGIN`) |

---

## 📁 Project Structure

```
Examination-Portal-3/
├── .github/
│   └── workflows/
│       └── ci.yml                 # CI: lint, test, build (student-web + backend), Docker build
├── docker/
│   ├── README.md                  # Servers to run, Docker commands, env
│   ├── DOCKER_COMMANDS.md         # Command reference and explanations
│   ├── docker-compose.yml         # Production: api, student-web, admin-web, redis
│   └── docker-compose.dev.yml     # Dev: api + student-web + redis, hot reload
├── apps/
│   ├── student-web/               # Student-facing React + Vite app
│   │   ├── src/
│   │   │   ├── components/        # Button, Card, ExamCard, PageLayout, Skeleton, etc.
│   │   │   ├── pages/            # SearchPage, ProfilePage
│   │   │   ├── services/          # api.js (Axios, token, base URL)
│   │   │   ├── styles/           # index.css (Tailwind)
│   │   │   ├── utils/            # dateUtils, etc.
│   │   │   ├── test/             # Vitest + React Testing Library
│   │   │   ├── App.jsx, main.jsx
│   │   │   └── index.html
│   │   ├── Dockerfile, nginx.conf, vite.config.js
│   │   └── package.json
│   └── admin-web/                # Admin panel (React + Vite)
│       ├── src/
│       │   ├── components/        # AdminLayout, ProtectedRoute
│       │   ├── pages/            # Login, Dashboard, Students, Exams, Rooms, Seating
│       │   ├── services/         # api.js (admin key / Bearer token)
│       │   ├── styles/
│       │   ├── App.jsx, main.jsx
│       │   └── index.html
│       ├── Dockerfile, vite.config.js
│       └── package.json
├── backend/                      # Express API
│   ├── prisma/
│   │   ├── schema.prisma         # Student, Exam, Staff, options (PostgreSQL)
│   │   └── seed.js               # Seed admin, options, sample data
│   ├── SUPABASE_SETUP.md         # Supabase connection and first-time setup
│   ├── DATABASE.md               # DB options (PostgreSQL / MySQL)
│   ├── PRODUCTION.md             # Production deployment checklist
│   ├── src/
│   │   ├── config/               # config.js (Zod-validated env)
│   │   ├── database/             # database.js (Prisma client)
│   │   ├── middleware/           # auth.middleware.js (verifyToken, authorizeStudent, authorizeAdmin, validate)
│   │   ├── modules/
│   │   │   ├── auth/             # login, adminLogin (auth.controller + auth.service)
│   │   │   ├── students/         # getProfile, register
│   │   │   ├── exams/            # list, getById
│   │   │   ├── rooms/            # list, getById
│   │   │   └── seating/         # list, assign
│   │   ├── utils/
│   │   │   ├── redis.js
│   │   │   └── schemas.js        # Zod: studentSchema, verificationSchema, adminLoginSchema
│   │   └── index.js              # Express app, helmet, CORS, rate limit, routes, error handler
│   ├── .env.example               # DATABASE_URL, DIRECT_URL, REDIS_URL, etc.
│   ├── Dockerfile
│   └── package.json
├── package.json                  # Root scripts: client, server, admin, test
├── README.md                     # This file
└── SECURITY_AND_CODE_AUDIT.md    # Security audit and recommendations
```

---

## 🚀 Run Commands

### Prerequisites

- **Node.js** v20+
- **Docker** (optional, for containerized run)

### Root (from repo root)

| Command | Description |
|---------|-------------|
| `npm run client` | Start student web dev server (port 5173) |
| `npm run server` | Start backend dev server (port 8787) |
| `npm run admin` | Start admin web dev server (port 5174) |
| `npm run dev` | Run backend + student web concurrently |
| `npm run test` | Run student-web Vitest suite |

### Backend (`cd backend`)

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies + `prisma generate` |
| `npm run dev` | Start API with `--watch` (port 8787) |
| `npm start` | Start API (production) |
| `npm run db:seed` | Seed database (create default admin from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`) |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run format` | Prettier on `src/**/*.js` |

**Backend env:** Copy `backend/.env.example` to `backend/.env` and set:

- `DATABASE_URL`, `DIRECT_URL` (Supabase — see [SUPABASE_SETUP.md](backend/SUPABASE_SETUP.md))
- `PORT`, `NODE_ENV`, `REDIS_URL`, `JWT_SECRET`, `ADMIN_API_KEY`, `CORS_ORIGIN`
- Optional: `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` for `npm run db:seed`

### Student Web (`cd apps/student-web`)

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Vite dev server (port 5173) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` / `npm run lint:fix` | ESLint |
| `npm run format` | Prettier |
| `npm run test` | Vitest run once |
| `npm run test:watch` | Vitest watch |

### Admin Web (`cd apps/admin-web`)

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Vite dev server (port 5174) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` / `npm run lint:fix` | ESLint |

### Docker

| Command | Description |
|---------|-------------|
| `docker compose -f docker/docker-compose.yml up -d` | Run api + student-web + admin-web + redis (detached) |
| `docker compose -f docker/docker-compose.yml up -d --build` | Rebuild images and start |
| `docker compose -f docker/docker-compose.dev.yml up -d` | Dev: api + student-web + redis, hot reload |

See [docker/README.md](docker/README.md) and [docker/DOCKER_COMMANDS.md](docker/DOCKER_COMMANDS.md) for full details and troubleshooting.

**URLs**

- **With Docker (prod):** API → http://localhost:8787, Student → http://localhost (80), Admin → http://localhost:8080
- **Without Docker:** Student → http://localhost:5173, Admin → http://localhost:5174, API → http://localhost:8787

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, Vite 5, Tailwind CSS 4, Framer Motion, Lucide React, React Router 7, Axios |
| **Backend** | Node.js 20, Express 4, Prisma, PostgreSQL (Supabase), ioredis, Helmet, CORS, express-rate-limit, compression, JWT, bcryptjs, Zod, Pino |
| **Database** | PostgreSQL via Supabase (see [DATABASE.md](backend/DATABASE.md) for MySQL option) |
| **DevOps** | Docker, Docker Compose, Nginx (student-web prod), GitHub Actions (CI) |

---

## 📡 API Reference (v1)

Base path: `/api/v1`.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | — | Health check (DB, Redis) |
| `POST` | `/auth/login` | — | Student login (collegeId + verification) |
| `POST` | `/auth/admin/login` | — | Admin login (email + password) |
| `GET` | `/student/*` | Student JWT | Get student profile + exams (collegeId in path) |
| `POST` | `/student` | Admin JWT or X-Admin-Key | Register student |
| `GET` | `/exams` | — | List exams |
| `GET` | `/exams/:id` | — | Get exam by id |
| `GET` | `/rooms` | — | List rooms |
| `GET` | `/rooms/:id` | — | Get room by id |
| `GET` | `/seating` | — | List seating |
| `POST` | `/seating` | — | Assign seating |

---

## 🔧 Code Quality & CI/CD

- **ESLint + Prettier** in backend and both apps.
- **Vitest + React Testing Library** in student-web.
- **CI (`.github/workflows/ci.yml`):** on push/PR to main/master:
  - Student-web: install, lint, test, build
  - Backend: install, lint
  - Docker: build images with `docker compose -f docker/docker-compose.yml build`

---

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit changes (`git commit -m 'Add AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📖 Other options & next steps

| Need | Action |
|------|--------|
| **Use MySQL instead of PostgreSQL** | See [backend/DATABASE.md](backend/DATABASE.md) — change Prisma provider and `DATABASE_URL`. |
| **Self-host database** | Use any PostgreSQL/MySQL host; set `DATABASE_URL` and `DIRECT_URL` in `backend/.env`. |
| **Run without Redis** | Leave `REDIS_URL` unset or empty; API uses in-memory fallback where applicable. |
| **Container name conflict** | See [docker/DOCKER_COMMANDS.md](docker/DOCKER_COMMANDS.md) — `docker rm -f <name>` or `docker compose down` then `up -d`. |
| **First deploy** | Follow [backend/PRODUCTION.md](backend/PRODUCTION.md) and [backend/SUPABASE_SETUP.md](backend/SUPABASE_SETUP.md). |

---

## 📝 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ by Alliance**

</div>
