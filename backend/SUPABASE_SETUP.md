# Step-by-step: Connect this project to your Supabase database

Use this guide with your **"college project"** (or **"exam alloted room"**) Supabase project. Your database is **Healthy** and in **Oceania (Sydney)** — we only need to add the connection string and create the tables.

---

## I just cloned the repo — will the database work?

**No, not until you add credentials.** The database is **cloud-based** (Supabase). It does **not** live in the repo. The repo also does **not** contain `backend/.env` (it is in `.gitignore`, so it is never committed).

| If you… | What happens |
|--------|----------------|
| Run the server **without** creating `backend/.env` | The app will fail when it tries to connect: e.g. *"DATABASE_URL is not defined"* or *"Authentication failed"*. The database **will not** work. |
| Create `backend/.env` from `.env.example` and add the **shared** `DATABASE_URL` and `DIRECT_URL` (from your team lead) | The server connects to the **same cloud database** everyone uses. The database **will** work. |

**What to do after cloning:**

1. Copy `backend/.env.example` to `backend/.env`.
2. Get the **shared** `DATABASE_URL` and `DIRECT_URL` from your team lead (see *Development: all developers use the same database* below). Paste them into `backend/.env`. If the password contains `@` or `#`, use `%40` or `%23` in the URL.
3. From the `backend` folder run: `npx prisma generate`. If the database was just created or reset, also run `npx prisma db push` and `npm run db:seed`.
4. Start the server (`npm run server` or `npm run dev`). It will use the cloud database.

---

## When to run: `cd backend && npx prisma generate && npx prisma db push && npm run db:seed`

| When | Use it? |
|------|--------|
| **First time** connecting this project to Supabase (or a new Supabase project) | **Yes** — creates tables and seed data. |
| **After cloning** the repo (and you’ve added `backend/.env` with Supabase URLs) | **Yes** — if the DB was never set up; or run at least `npx prisma generate` so the app can connect. |
| **Database was reset or recreated** (empty Supabase) | **Yes** — run the full command to recreate tables and seed. |
| **Someone changed `prisma/schema.prisma`** (new tables/columns) | **Yes** — run `npx prisma generate` and `npx prisma db push`; run `npm run db:seed` only if you need to repopulate options/sample data. |
| **Every time you start the server** | **No** — only when setting up or after schema/DB changes. |
| **Just to “sync” or “refresh” data** | **No** — seed can duplicate or overwrite data; use only when the DB is new or intentionally reset. |

Run from the **repo root** or from the **backend** folder (if already in `backend`, use `npx prisma generate && npx prisma db push && npm run db:seed`).

---

## Step 1: Get your database connection strings from Supabase

1. Open your Supabase dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project (**college project** or **exam alloted room**).
3. Click **Connect** (top right) → open the **ORMs** tab → select **Prisma**.
4. You’ll see two URIs. Replace `[YOUR-PASSWORD]` in both with your **database password** (set when creating the project; use **Reset database password** in Project Settings → Database if needed):
   - **DATABASE_URL** (pooled, port **6543**) — for the app at runtime.
   - **DIRECT_URL** (direct, port **5432**) — for running migrations / `prisma db push` and `db:seed`.
5. Copy both strings and keep them for the next step. Example format (your project ref may differ):
   ```text
   DATABASE_URL: postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
   DIRECT_URL:  postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres
   ```

---

## Step 2: Create the backend `.env` file

1. Open the project in your editor and go to the **backend** folder.
2. Copy the example env file:
   - Copy `backend/.env.example` and paste it as `backend/.env` (in the same folder).
3. Open `backend/.env` and set **DATABASE_URL** and **DIRECT_URL**:
   - Paste the **DATABASE_URL** from Step 1 (with your real password).
   - Paste the **DIRECT_URL** from Step 1 (same password).
   - Example (use your own ref and password):
     ```env
     DATABASE_URL=postgresql://postgres.lnfurckqavkdrkxsrtsu:YOUR_REAL_PASSWORD@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
     DIRECT_URL=postgresql://postgres.lnfurckqavkdrkxsrtsu:YOUR_REAL_PASSWORD@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres
     ```
4. Leave the rest as in `.env.example` (or set `JWT_SECRET`, `ADMIN_API_KEY` when you’re ready).

Save the file.

---

## Step 3: Stop the backend (if it’s running)

- In the terminal where `npm run server` (or `npm run dev`) is running, press **Ctrl+C** to stop it.  
We’ll start it again after creating the tables.

---

## Step 4: Create tables and seed data in Supabase

In a terminal, run these commands **from the project root** (or from `backend` as noted):

```bash
cd backend
npx prisma generate
npx prisma db push
npm run db:seed
```

- **prisma generate** — generates the Prisma client for PostgreSQL.
- **prisma db push** — creates the tables (Students, Exams, Staff, etc.) in your Supabase database.
- **db:seed** — adds sample admin user and sample students/exams so you can log in and test.

If you see any error about `DATABASE_URL`, double-check Step 2 (password, no extra spaces, correct URI).

---

## Step 5: Start the backend again

From the project root:

```bash
npm run server
```

Or from the repo root:

```bash
cd backend && npm run dev
```

The backend will now use your Supabase database. You can confirm in Supabase: **Database → Schema Visualizer** (or **Tables**) — you should see **Students**, **Exams**, **Staff** and related enums.

---

## Step 6: Test the app

- **Student portal:** Open the student app (e.g. `npm run client`), log in with a seeded student (e.g. college ID `JIS/5555/6666`, password last 3 digits of roll: `666`).
- **Admin portal:** Open the admin app (e.g. `npm run admin`), log in with the seeded admin (default in seed: `admin@example.com` / `Admin@123` — see `backend/prisma/seed.js`).

---

## Development: all developers use the same database

During development, **everyone on the team uses one shared Supabase project** so they all see the same data (students, exams, options, etc.).

### How it works

| Who | Action |
|-----|--------|
| **Team lead / project owner** | Creates one Supabase project (or uses the existing one). Gets **DATABASE_URL** and **DIRECT_URL** from Dashboard → Connect → Prisma, with the real database password filled in. Shares these two strings with the team **securely** (e.g. 1Password, Bitwarden, Slack private channel, or encrypted message). **Never commit** `.env` or paste URLs in public repos or chat. |
| **Each developer** | Clones the repo, copies `backend/.env.example` to `backend/.env`, and pastes the **shared** `DATABASE_URL` and `DIRECT_URL` they received. If the password contains `@` or `#`, use URL encoding in the URLs (`@` → `%40`, `#` → `%23`). Runs `npx prisma generate`, `npx prisma db push` (when schema changes), and `npm run db:seed` (once, or when DB was reset). |

### Summary

- **One Supabase project** = one shared dev database for the whole team.
- **`.env` is gitignored** — each developer has their own local `backend/.env` with the same connection strings.
- **Share credentials securely** — password/URLs only via a secrets manager or private channel, not in git or public docs.
- **Schema changes**: when someone updates `prisma/schema.prisma`, they run `npx prisma db push`; all other devs pull the code and run `npx prisma generate` (and `db push` if they need the same DB shape). Everyone continues to use the same DB.
- **Optional**: use a separate Supabase project for **production** and keep this one for **development** only, so devs don’t touch live data.

---

## Quick reference

| Step | Action |
|------|--------|
| 1 | Supabase Dashboard → Project Settings → Database → Connection string (URI, Transaction) → copy and replace password |
| 2 | Create `backend/.env` from `.env.example`, set `DATABASE_URL` to that URI |
| 3 | Stop backend (Ctrl+C) |
| 4 | `cd backend` → `npx prisma generate` → `npx prisma db push` → `npm run db:seed` |
| 5 | Start backend again (`npm run server` or `npm run dev`) |
| 6 | Test student and admin apps |

If any step fails, share the exact error message and which step you’re on, and we can fix it step by step.
