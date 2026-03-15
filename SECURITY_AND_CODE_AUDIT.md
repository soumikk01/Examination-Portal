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
   `apps/student-web/.env.development` and `.env.production` are not ignored (only `.env`, `.env.local`, `.env.*.local`). They currently only set `VITE_API_URL` (not secret). To avoid accidentally committing secrets later, consider adding `.env.development` / `.env.production` to `.gitignore` and documenting required vars in README/`.env.example`.

---

## Broken or Incomplete Logic

1. **Admin UI has no real auth**  
   `apps/admin-web/src/pages/Login.jsx` does not authenticate; it only links to the dashboard. Anyone who can open the admin app can open the dashboard. Only the backend `POST /student` is protected by `X-Admin-Key`. **Recommendation:** Add real admin login (e.g. username/password or SSO) and protect admin routes (e.g. require token/session).

2. **Seating and room endpoints**  
   `GET /seating`, `POST /seating`, `GET /rooms`, `GET /rooms/:id` have no auth. If `POST /seating` is meant to change data, it should be restricted (e.g. admin or internal only). Room/exam list may be intentionally public for students.

3. **Seating / room implementation**  
   `room.service.js` and `seating.service.js` return empty list / “not yet implemented”. Not a security bug but logic is stubbed.

4. **Redis in health check**  
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

## Code Duplication (Clones)

- **API client setup**  
  `apps/admin-web/src/services/api.js` and `apps/student-web/src/services/api.js` both create an Axios instance with base URL and JSON headers. They differ in purpose (admin key vs. student token, interceptors). Acceptable duplication; optional improvement: shared base factory in a common package.

- **Student schema**  
  Backend uses Zod `studentSchema` and Prisma schema; both define similar fields. Single source of truth is Prisma; Zod is for input validation. No change needed.

---

## Recommendations Summary

| Priority | Action |
|----------|--------|
| High | Add real admin login and protect admin UI routes; avoid relying only on a frontend admin key. |
| High | Protect `POST /seating` (and any other mutating admin endpoints) with admin auth. |
| Medium | Consider ignoring `.env.development` / `.env.production` in git or documenting that they must not contain secrets. |
| Low | Remove or restrict `script-src 'unsafe-inline'` in CSP when possible. |
| Low | Optionally share API client creation (base URL, headers) between admin and student apps. |

---

*Audit performed against the codebase as of the fixes above.*
