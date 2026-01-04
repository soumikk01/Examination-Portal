# Examination Portal

A modern **React + Cloudflare Worker (D1 Database)** application to display student information and exam schedules.

## 📁 Project Structure

```
Examination-Portal/
├── api/                        # Backend (Cloudflare Worker)
│   ├── src/
│   │   └── index.js            # API Routes (Hono Framework)
│   ├── schema.sql              # D1 Database Schema
│   └── wrangler.toml           # Cloudflare Configuration
│
├── frontend/                   # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI Components
│   │   ├── pages/              # Page Components (SearchPage, ProfilePage)
│   │   ├── services/           # API Service Layer
│   │   └── styles/             # CSS Files
│   └── vite.config.js          # Vite Configuration
│
├── package.json                # Root Package (Orchestrator)
└── README.md                   # This File
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install
cd frontend && npm install
cd ../api && npm install

# Run development server (Frontend + Backend)
npm run dev
```

**Access:**
- Frontend: http://localhost:5174
- Backend API: http://localhost:8787

## 🔍 Features

- **Student Search:** Search by College ID
- **Profile View:** View student details and exam schedules
- **D1 Database:** Persistent data storage with Cloudflare D1

## 📊 Tech Stack

| Layer    | Technology          |
|----------|---------------------|
| Frontend | React, Vite         |
| Backend  | Hono (Cloudflare Workers) |
| Database | Cloudflare D1 (SQLite) |
| Styling  | Custom CSS (Glassmorphism) |

## 📜 License

ISC