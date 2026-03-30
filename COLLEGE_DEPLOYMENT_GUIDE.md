# Examination Portal — IT Deployment Guide

Welcome to the Examination Portal. This guide provides step-by-step instructions for the college Information Technology (IT) department to successfully host, database-seed, and run this application on your own secure infrastructure.

## 1. System Requirements

Before beginning, ensure your host server meets the following requirements:
- **Node.js**: Version 20.0 or higher.
- **PostgreSQL**: Version 13.0 or higher (We recommend AWS RDS or a dedicated on-premises Docker deployment).
- **Redis**: (Optional, but highly recommended) Redis 6+. Required only if you anticipate more than 5,000 students accessing the portal simultaneously.

---

## 2. Infrastructure Setup (Database)

**The entire system stores data strictly in PostgreSQL.** No business configurations or dropdown lists are hardcoded into the application codebase.

### Option A: Cloud / Managed Database
Create an **AWS RDS PostgreSQL** instance or connect to an existing cluster. Ensure the credentials are securely stored.

### Option B: Self-Hosted Docker Database
If you prefer on-premises isolation, you can spin up PostgreSQL using Docker:
```bash
docker run --name exam-db -p 5432:5432 -e POSTGRES_PASSWORD=your_secure_password -d postgres:15
```

---

## 3. Environment Variable Configuration

Locate the `backend/.env` file. You must strictly configure the following keys before starting the server:

- `DATABASE_URL` — Your PostgreSQL connection string. Ensure this points to your new, empty database.
- `JWT_SECRET` — A secure, random 64-character string. **Do not share this.**
- `CORS_ORIGIN` — Comma-separated domains where the frontend applies are hosted (e.g., `https://admin.yourcollege.edu,https://students.yourcollege.edu`).

---

## 4. Bootstrapping the Database

Once your environment variables are configured, you must push the schema into your empty database and bootstrap the initial admin credentials.

From the `backend/` directory, run the following safe migration command:

```bash
# 1. Generate Prisma Client
npm run postinstall

# 2. Deploy Schema to Production Database
npm run db:deploy

# 3. Seed College Options and Default Staff
npm run db:seed
```

> [!WARNING]
> DO NOT use `npx prisma db push` in production. Always stick strictly to `npm run db:deploy` to prevent accidental destructive schema alterations.

---

## 5. Starting the Applications

The portal consists of three independent nodes. In a production environment, you should use **PM2** or **Docker** to ensure the processes restart upon crash.

1. **Backend Server** (`/backend`)
   ```bash
   cd backend
   npm ci
   npm run start
   ```

2. **Admin Web Portal** (`/apps/admin-web`)
   ```bash
   cd apps/admin-web
   npm ci
   npm run build
   # Serve the /dist folder using NGINX or Apache
   ```

3. **Student Web Portal** (`/apps/student-web`)
   ```bash
   cd apps/student-web
   npm ci
   npm run build
   # Serve the /dist folder using NGINX or Apache
   ```

## 6. Security & Best Practices
- **HTTPS**: You MUST serve your applications using an SSL proxy (e.g. NGINX with Let's Encrypt).
- **Security Headers**: The backend API ships with `helmet` active. It enforces strict Content Security Policies.
- **Rate Limiting**: Brute force protection is enabled by default to prevent credential stuffing.

If you encounter any database connection failures, review the `backend/logs` safely output via the `pino` transport monitor.
