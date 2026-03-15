# 📚 Examination Portal

<div align="center">

A modern, professional web application for managing student examination schedules.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-20+-green.svg)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/docker-ready-brightgreen.svg)](https://docker.com)
[![React](https://img.shields.io/badge/react-18+-61dafb.svg)](https://react.dev)
[![Express](https://img.shields.io/badge/express-4.x-black.svg)](https://expressjs.com)

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Screenshots](#-screenshots)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Tech Stack](#️-tech-stack)
- [API Reference](#-api-reference)
- [Contributing](#-contributing)
- [Author](#-author)
- [License](#-license)

---

## ✨ Features

### 🎯 Core Features
| Feature | Description |
|---------|-------------|
| 🔍 **Student Search** | Search students by ID or name with auto-formatting |
| 📅 **Exam Schedule** | View upcoming and past exams with date filtering |
| 📊 **Exam Filters** | Filter by exam type (ODD, EVEN, TEST-I, TEST-II) |
| 📱 **Responsive Design** | Works seamlessly on mobile, tablet, and desktop |

### 🎨 UI/UX Features
| Feature | Description |
|---------|-------------|
| 🌈 **Modern Design** | Gradient backgrounds with glass morphism effects |
| ⏳ **Skeleton Loading** | Smooth loading states for better UX |
| 📌 **Important Notices** | Pinned exam instructions and guidelines |
| 🏷️ **Paper Details** | Paper Name and Paper Code displayed side by side |
| 🕐 **Professional Icons** | Time and Room shown with Lucide icons |
| ✅ **Exam Status** | Clear distinction between upcoming and completed |
| 🎉 **Completion Message** | Celebration when all exams are done |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org) v20+
- [Docker](https://docker.com) (optional, recommended)

### With Docker (Recommended)

```bash
# From repo root
docker compose -f docker/docker-compose.yml up --build
```

🌐 **Student app:** http://localhost (port 80)

### Without Docker

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Student web
npm run client
# or: cd apps/student-web && npm run dev
```

🌐 **Student app:** http://localhost:5173

```bash
# Terminal 3 (optional) - Admin panel
npm run admin
# or: cd apps/admin-web && npm run dev
```

🌐 **Admin panel:** http://localhost:5174

### How admin, frontend & backend connect

| App | Port | Connects to |
|-----|------|-------------|
| **Backend** (API) | 8787 | Database, Redis |
| **Student web** (frontend) | 5173 | Backend via Vite proxy `/api` → `http://localhost:8787` |
| **Admin web** | 5174 | Backend via Vite proxy `/api` → `http://localhost:8787` |

- Both frontends use base URL `/api/v1` in dev; the Vite dev server proxies `/api` to the backend.
- Backend CORS allows `http://localhost:5173` and `http://localhost:5174` (set `CORS_ORIGIN` in `backend/.env` if needed).
- **Admin login:** Staff sign in with email + password. Backend verifies against the `Staff` table and issues a JWT; the dashboard is protected. After setting up the backend, run `cd backend && npm run db:seed` to create a default admin (email/password from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `backend/.env`; if unset, dev default is admin@example.com with a built-in dev password—**set both env vars and use a strong password in production**). Optional: `VITE_ADMIN_API_KEY` in `apps/admin-web/.env` still works for API/script-based student registration.

---

## 📁 Project Structure

```
examination-portal/
├── .github/workflows/        # CI/CD (e.g. ci.yml)
├── docker/
│   ├── docker-compose.yml
│   └── docker-compose.dev.yml
├── apps/
│   ├── student-web/          # Student-facing React + Vite app
│   │   ├── src/components/, pages/, services/, styles/
│   │   ├── Dockerfile, nginx.conf, vite.config.js
│   │   └── package.json
│   └── admin-web/            # Admin panel (React + Vite)
│       ├── src/components/, pages/, services/, styles/
│       ├── Dockerfile, nginx.conf, vite.config.js
│       └── package.json
├── backend/                  # Express.js + Prisma + SQLite
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── config/, database/, utils/, middleware/
│   │   └── modules/ (auth, exams, students, rooms, seating)
│   ├── Dockerfile
│   └── package.json
├── data/                     # SQLite DB (e.g. examination.db)
├── .env.example
├── package.json              # Root scripts: client, admin, server, test
└── README.md
```

---

## 🛠️ Tech Stack

<table>
<tr>
<td align="center" width="96">
<b>Frontend</b>
</td>
<td align="center" width="96">
<b>Backend</b>
</td>
<td align="center" width="96">
<b>Database</b>
</td>
<td align="center" width="96">
<b>DevOps</b>
</td>
</tr>
<tr>
<td align="center">React 18</td>
<td align="center">Express.js</td>
<td align="center">SQLite</td>
<td align="center">Docker</td>
</tr>
<tr>
<td align="center">Vite</td>
<td align="center">Node.js 20</td>
<td align="center">better-sqlite3</td>
<td align="center">Nginx</td>
</tr>
<tr>
<td align="center">Tailwind CSS</td>
<td align="center">CORS</td>
<td align="center">-</td>
<td align="center">Docker Compose</td>
</tr>
<tr>
<td align="center">Lucide Icons</td>
<td align="center">-</td>
<td align="center">-</td>
<td align="center">-</td>
</tr>
</table>

---

## 📡 API Reference (v1)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/health` | Health check (DB, Redis) |
| `POST` | `/api/v1/auth/login` | Student login (collegeId + verification) |
| `GET` | `/api/v1/student/:collegeId` | Get student profile + exams (auth required) |
| `POST` | `/api/v1/student` | Register student (X-Admin-Key required) |
| `GET` | `/api/v1/exams` | List exams |
| `GET` | `/api/v1/exams/:id` | Get exam by id |
| `GET` | `/api/v1/rooms` | List rooms |
| `GET` | `/api/v1/seating` | List seating |

📖 See [Backend README](backend/README.md) for detailed API documentation.

---

## 🔧 Code Quality

### ESLint & Prettier
Code linting and formatting are configured for consistent code style.

```bash
# Student web
cd apps/student-web && npm run lint
cd apps/student-web && npm run lint:fix
cd apps/student-web && npm run format

# Backend
cd backend && npm run lint
```

### Testing
Unit tests are set up with **Vitest** and **React Testing Library**.

```bash
# From root
npm run test

# Or from student-web
cd apps/student-web && npm run test
cd apps/student-web && npm run test:watch
```

### Error Handling
The student app API service (`apps/student-web/src/services/api.js`) includes:
- ✅ Custom `ApiError` class for typed errors
- ✅ `safeFetch()` wrapper with try-catch
- ✅ Automatic URL encoding for safety
- ✅ Proper HTTP error status handling

### CI/CD Pipeline
GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push:

| Step | Description |
|------|-------------|
| **Lint** | ESLint for apps/student-web & backend |
| **Test** | Vitest for student-web |
| **Build** | Vite build for student-web |
| **Docker** | `docker compose -f docker/docker-compose.yml build` |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

⭐ **Star this repo if you found it helpful!** ⭐

Made with ❤️ by Alliance

</div>
    
