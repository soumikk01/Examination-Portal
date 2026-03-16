# Database setup (client can use their own)

## Website structure & data flow

- **Database (Supabase)** stores all data; no business or dropdown data is stored in the codebase:
  - **ProgramOptions**, **BranchOptions**, **SemesterOptions**: programs, branches, semesters. Fetched via GET `/options/programs`, `/options/branches?program=`, `/options/semesters?program=`.
  - **AppOptions**: exam type, exam mode, exam category labels (values match Prisma enums). Fetched via GET `/options/exam-options`. All seeded by `npm run db:seed` into Supabase.
  - **Students**: collegeId, name, program, branch, semester, department, roll, etc. Used for login and for filtering in admin.
  - **Exams**: examId, subject, date, time, room, examType, examMode, examCategory, program, branch, semester, optional **studentId**. When **studentId** is set, that exam is shown only to that student; when null, it is shown to all students matching program/branch/semester.
  - **Staff**: admin users (email, password) for the admin panel.

- **Admin panel**:
  1. **Students** page: register students with Program, Branch, Semester so they can be filtered and see the right exams.
  2. **Exam schedule** page: admin selects **Program**, **Branch**, **Semester** → backend returns only **matching students** (GET `/students?program=&branch=&semester=`). Admin fills exam details (subjects, dates, time, room, type) and attaches students from that list (or creates a schedule-only exam with no student). On submit, exams are stored in the DB (with optional `studentId` per row).

- **Student portal**:
  - Student logs in with college ID (and verification). Backend loads student by collegeId; student has program, branch, semester.
  - **My Exams** (GET `/student/exams`): backend returns **published** exams where (program/branch/semester match the student) and (studentId is null OR studentId = this student). Result is shown as upcoming / past exams.

So: **Admin selects program/branch/semester → sees matching students → creates student-wise exam schedule → data stored in DB → student portal shows those exams** for the logged-in student.

---


The backend uses **Prisma** and supports **PostgreSQL** or **MySQL**. The client sets their own `DATABASE_URL` in `backend/.env`; no code change except the provider if they use MySQL.

## PostgreSQL (default) — Supabase, Neon, Railway, or self‑hosted

1. In `prisma/schema.prisma`, keep:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. In `backend/.env` set:
   ```env
   DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
   ```
   Example (Supabase): use the URI from **Dashboard → Project Settings → Database** (Transaction pooler, port 6543).

3. Apply schema and seed (optional):
   ```bash
   cd backend && npx prisma db push && npm run db:seed
   ```

---

## MySQL — client uses MySQL / MariaDB

1. In `prisma/schema.prisma`, change the datasource to:
   ```prisma
   datasource db {
     provider = "mysql"
     url      = env("DATABASE_URL")
   }
   ```
2. In `backend/.env` set:
   ```env
   DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DATABASE
   ```
3. Regenerate and push:
   ```bash
   cd backend && npx prisma generate && npx prisma db push
   npm run db:seed
   ```

That’s the only change: **provider** in the schema + **DATABASE_URL** in `.env`.

---

## MongoDB

This codebase is built for **SQL** (PostgreSQL/MySQL). To use **MongoDB**, the client would need to either:

- Use a different backend (e.g. Node + Mongoose), or  
- Use Prisma’s MongoDB provider and adapt the schema (different relation model, no migrations in the same way).

We do not support MongoDB out of the box; recommend the client use PostgreSQL or MySQL unless they are ready to adapt the app for MongoDB.
