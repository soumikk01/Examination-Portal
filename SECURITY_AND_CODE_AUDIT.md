# Security & Code Audit Report

This document summarizes findings from a review of the Examination Portal codebase: bugs, broken logic, code duplication, and sensitive information handling.

---

## Fixed in This Pass

| Issue | Location | Fix |
|-------|----------|-----|
| **Null `studentRoll` crash** | `backend/src/modules/auth/auth.service.js` | Guard before `slice(-3)`; return `VERIFICATION_FAILED` if roll is null/empty. |
| **Error message leak** | `backend/src/modules/students/student.controller.js` | Replaced `'Registration error: ' + error.message` with generic "Registration failed. Please try again." |
| **Admin API base URL in production** | `apps/admin-web/src/services/api.js` | Use `VITE_ADMIN_API_URL` when set (like student-web’s `VITE_API_URL`) so production can point to another origin. |
| **Console error in production** | `apps/student-web/src/pages/ProfilePage.jsx` | Removed `console.error('Profile Fetch Error:', err)` to avoid leaking stack/details. |
| **Invalid exam ID** | `backend/src/modules/exams/exam.controller.js` | Validate `Number(req.params.id)`; return 400 for NaN before calling service. |
| **Student roll / sessionId leak** | `backend/src/modules/students/student.service.js` | `getByCollegeId` uses profile-safe `select` (no `studentRoll`, no `sessionId`); response and cache never expose verification data. |
| **Validation error shape** | `backend/src/middleware/auth.middleware.js` | `validate()` returns `{ error: 'Validation failed', details, requestId }` and passes unexpected errors to `next(error)`. |
| **Register errors not passed to handler** | `backend/src/modules/students/student.controller.js` | Non–P2002 errors are passed to `next(error)` for consistent logging and 500 response. |
| **Duplicate exams for student** | `backend/src/modules/exams/exam.service.js` | `listForStudent` deduplicates by exam key; prefers student-specific row when both schedule-only and assigned row exist. |
| **Env files not ignored** | `.gitignore` | Added `**/.env.development` and `**/.env.production`. If already committed, run `git rm --cached` on those paths once. |
| **Admin email in logs** | `backend/src/index.js` | Added `req.body.email` to Pino `redact` so admin login email is not logged. |
| **Admin UI has no real auth** | `apps/admin-web/src/pages/Login.jsx` & `index.js` | Added full JWT authentication for admins, protecting all API and dashboard routes. |
| **Seating and room endpoints exposed** | `backend/src/index.js` | Added `authorizeAdmin` middleware to all `/rooms`, `/seating`, and `/settings` modifying endpoints. |
| **Seating / room implementation stubbed** | `room.service.js` & `seating.service.js` | Completely implemented algorithms for persistent auto-allotment of rooms and seating via database. |
| **Hardcoded venues on capacity update** | `backend/src/modules/rooms/room.service.js` | Added logic to dynamically assign venue ('Main Building' vs 'C Block') based on room prefix during capacity updates. |
| **MBA program missing in schemas** | `backend/src/utils/schemas.js` | Added `MBA` to the Zod `program` validations. |

---

## Sensitive Information & Secrets

### Good

- No hardcoded passwords, API keys, or JWT secrets in source.
- Backend uses `config` from env (e.g. `JWT_SECRET`, `ADMIN_API_KEY`, `DATABASE_URL`).
- `.env` and `.env.*.local` are in `.gitignore`.
- **Seed script:** Default admin password is no longer logged; production requires `SEED_ADMIN_PASSWORD` (see `backend/prisma/seed.js` and `backend/.env.example`).
- Pino logger redacts auth-related fields (e.g. `authorization`, `cookie`, `verification`, `sessionId` in response body).

### Risks

1. **Admin API key in frontend**  
   `VITE_ADMIN_API_KEY` is read in `apps/admin-web` and sent as `X-Admin-Key`. Anyone with the admin app bundle can see the key if it’s set. Prefer admin auth via real login (e.g. password + session/JWT) and keep the key only on the backend or in server-side admin flows.

2. **Env files**  
   `**/.env.development` and `**/.env.production` are now in `.gitignore`. If they were already committed, run `git rm --cached` on them once so future changes are not tracked. Document required vars in README or `.env.example` only.

---

## Broken or Incomplete Logic

1. **Redis in health check**  
   `backend/src/index.js` checks `redis.status === 'ready'`. For `ioredis`, this is correct. If Redis is down, health correctly reports DEGRADED.

---

## Bugs and Edge Cases

- **Auth service**  
  Handled: students with null/empty `studentRoll` no longer cause a crash; they get a verification failure response.

- **Exam ID**  
  Handled: non-numeric `id` (e.g. `"abc"`) now returns 400 “Invalid exam ID” instead of passing NaN to Prisma.

- **Student profile route**  
  Student route is `/student/:collegeId/*` and profile uses `collegeId` from params; behavior is consistent.

- **CORS**  
  Backend uses a strict origin list from `CORS_ORIGIN`; only configured origins are allowed.

---

## Data & unused files

- **No business data in repo** – Options (programs, branches, semesters, exam types) live in Supabase; seed script populates them. No CSV/JSON data files in source.
- **PostgreSQL only** – No SQLite or file-based DB; backend uses Supabase (PostgreSQL). `*.db` stays in `.gitignore` to avoid committing any DB files by mistake.
- **Rooms/seating** – Controllers and services are stubbed (return empty list / “not implemented”); kept for API surface. No unused source files found; all components and pages are referenced.

## Code Duplication (Clones)

- **API client setup**  
  `apps/admin-web/src/services/api.js` and `apps/student-web/src/services/api.js` both create an Axios instance with base URL and JSON headers. They differ in purpose (admin key vs. student token, interceptors). Acceptable duplication; optional improvement: shared base factory in a common package.

- **Options fetching (admin)**  
  `Exams.jsx` and `Students.jsx` both fetch programs, then branches/semesters when program changes. Pattern is similar; could be extracted to a `useProgramBranchSemester()` hook in admin-web if desired. Low priority.

- **Student schema**  
  Backend uses Zod `studentSchema` and Prisma schema; both define similar fields. Single source of truth is Prisma; Zod is for input validation. No change needed.

---

## Recommendations Summary

| Priority | Action |
|----------|--------|
| High | Add real admin login and protect admin UI routes; avoid relying only on a frontend admin key. |
| High | Protect `POST /seating` (and any other mutating admin endpoints) with admin auth. |
| Medium | `.env.development` / `.env.production` are now in `.gitignore`; run `git rm --cached` on them once if already committed. |
| Low | Remove or restrict `script-src 'unsafe-inline'` in CSP when possible. |
| Low | Optionally share API client creation (base URL, headers) between admin and student apps. |

---

*Audit performed against the codebase as of the fixes above.*
