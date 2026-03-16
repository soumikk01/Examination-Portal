# Production deployment (Supabase + industry practices)

All application data lives in **Supabase** (cloud). The codebase holds **no business data**—only schema, seed scripts, and config via environment variables.

---

## Data in Supabase only

| Data | Table(s) | How it gets there |
|------|----------|-------------------|
| Programs, branches, semesters | ProgramOptions, BranchOptions, SemesterOptions | One-time seed (`npm run db:seed`) or Supabase Table Editor |
| Exam type / mode / category options | AppOptions | One-time seed |
| Students, exams, staff | Students, Exams, Staff | Admin UI + seed (sample data) |

At runtime the app **only reads/writes Supabase**; no dropdown or option lists are hardcoded in the codebase.

---

## Production checklist

### 1. Environment variables (no secrets in code)

Set in your host (Vercel, Railway, Render, or server `.env`):

- **DATABASE_URL** – Supabase pooled connection string (port 6543, `?pgbouncer=true`).
- **DIRECT_URL** – Supabase direct connection string (port 5432) for migrations and seed.
- **JWT_SECRET** – Strong random string (e.g. `openssl rand -base64 32`). Required for student/admin tokens.
- **ADMIN_API_KEY** – Strong secret for admin API access (if using header auth).
- **NODE_ENV=production**
- **CORS_ORIGIN** – Comma-separated production frontend URLs (e.g. `https://portal.example.com,https://admin.example.com`).
- **REDIS_URL** – Production Redis URL (or leave default if using in-memory fallback and that’s acceptable).
- **SEED_ADMIN_EMAIL** / **SEED_ADMIN_PASSWORD** – Only if you run seed in production; use a strong password.

### 2. Database (Supabase)

- Create a Supabase project and get **DATABASE_URL** and **DIRECT_URL** from Dashboard → Connect → Prisma.
- Run once (from a machine that can reach Supabase):

  ```bash
  cd backend
  npx prisma generate
  npx prisma db push
  npm run db:seed
  ```

- Seed creates tables and initial options (programs, branches, semesters, exam types/modes/categories) and optionally a default admin and sample students. Change default admin password after first login.

### 3. Backend

- Run the API with `NODE_ENV=production`.
- Ensure the process has access to `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `CORS_ORIGIN`, and optionally `REDIS_URL` and `ADMIN_API_KEY`.

### 4. Frontends (student + admin)

- Set **VITE_ADMIN_API_URL** (and **VITE_ADMIN_API_KEY** if used) for the admin app to point at the production API.
- Point the student app at the same API (proxy or env) so all requests go to your backend, which talks only to Supabase.

### 5. Security

- Use HTTPS everywhere.
- Restrict **CORS_ORIGIN** to your real frontend origins.
- Rotate **JWT_SECRET** and **ADMIN_API_KEY** if ever exposed; then re-login and re-auth.
- Do not commit `.env` or any file containing real secrets.

---

## Summary

- **No data in codebase** – options and business data are in Supabase; seed runs once to bootstrap.
- **Production-ready** – config via env, health check at `/api/v1/health`, structured errors.
- **Industry-level** – single cloud DB (Supabase), env-based config, no hardcoded lists at runtime.
