# Examination Portal - Backend API

Express.js + SQLite API for the Examination Portal.

## Quick Start

```bash
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/students` | List all students |
| GET | `/api/search?query=...` | Search students |
| GET | `/api/student/{collegeId}` | Get student with exams |
| POST | `/api/student` | Create student |
| POST | `/api/student/{id}/exam` | Add exam |
| DELETE | `/api/student/{id}` | Delete student |
| DELETE | `/api/student/{id}/exam/{examId}` | Delete exam |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8787 | Server port |
| `NODE_ENV` | development | Environment mode |
