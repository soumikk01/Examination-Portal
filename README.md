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

## 🔧 Backend

The API is built with **Express.js**, **Prisma**, **SQLite**, and **Redis**, designed for reliability and security.

### Backend Features

| Area | Description |
|------|-------------|
| **Auth** | Student login (College ID + last 3 digits of roll), Admin login (email + bcrypt password), JWT (8h expiry), session invalidation on re-login |
| **Data** | Students, Exams, Rooms, Seating; Prisma ORM with SQLite; optional Redis for caching |
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
│   ├── docker-compose.yml         # Production: api, student-web, redis
│   └── docker-compose.dev.yml    # Dev: api + student-web with hot reload
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
│   │   ├── schema.prisma         # Student, Exam, Staff models (SQLite)
│   │   └── seed.js               # Seed admin (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD)
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
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── data/                         # SQLite DB (e.g. examination.db) — often gitignored
├── package.json                  # Root scripts: client, server, admin, test
├── README.md
└── SECURITY_AND_CODE_AUDIT.md
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

- `PORT`, `NODE_ENV`, `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `ADMIN_API_KEY`, `CORS_ORIGIN`
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
| `docker compose -f docker/docker-compose.yml up --build` | Run api + student-web + redis (student app on port 80) |
| `docker compose -f docker/docker-compose.dev.yml up` | Dev setup with hot reload (api 8787, student-web 5173) |

**URLs**

- **With Docker (prod):** Student app → http://localhost (80)
- **Without Docker:** Student → http://localhost:5173, Admin → http://localhost:5174, API → http://localhost:8787

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, Vite 5, Tailwind CSS 4, Framer Motion, Lucide React, React Router 7, Axios |
| **Backend** | Node.js 20, Express 4, Prisma, better-sqlite3, ioredis, Helmet, CORS, express-rate-limit, compression, JWT, bcryptjs, Zod, Pino |
| **Database** | SQLite (Prisma) |
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

## 📝 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ by Alliance**

</div>
