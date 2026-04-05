# JIS Examination Portal: Comprehensive Technical Architecture Document

## 1. Executive Summary

The Examination Portal is an enterprise-grade, web-based examination management and student seating orchestration system. Built for high-availability during peak exam seasons, the system automates room capacity planning, student-to-seat mapping, mathematical department interleaving (to prevent cheating), and instant cross-device schedule delivery. 

The system operates on a modern, decoupled Monorepo architecture designed for rapid feature scaling, maximum offline availability for mobile clients, and stringent security against brute-force and DDoS attacks.

---

## 2. Monorepo Architecture & Topology

The codebase embraces an NPM Workspace monorepo pattern, solving code-duplication and enabling synchronized CI/CD deployments.

### 2.1 Workspace Structure
*   **`apps/student-web/`**: A Vite + React application optimized for mobile-first consumption. It utilizes eager background-fetching and heavy `sessionStorage`/in-memory caching to provide progressive web app (PWA) like offline persistence when network conditions are poor.
*   **`apps/admin-web/`**: A Vite + React administrative dashboard focused on rich data tables, complex CSV/PDF parsing uploads, and dynamic state management (e.g., toggling global Maintenance Mode).
*   **`packages/ui/`**: A strictly decoupled React UI library. It houses headless and styled components (`<Button>`, `<Modal>`, `<NoticeBoard>`). Both `student-web` and `admin-web` consume these components, guaranteeing design system uniformity across the ecosystem.
*   **`backend/`**: A Node.js + Express.js API server acting as the central nervous system. It strictly enforces business rules, handles heavy algorithmic seating calculations, and manages database connection pooling.

---

## 3. Data Persistence & Caching Layer

### 3.1 Relational Database (PostgreSQL / Supabase)
Data integrity is paramount. The system utilizes deeply relational schemas designed via **Prisma ORM**.
*   **Schema Design**: Enums (`ExamMode`, `Program`) are strictly enforced at the database level. Structural definitions (`ProgramOptions`, `BranchOptions`, `SemesterOptions`) are dynamic tables, not hardcoded constants. This allows admins to onboard a new engineering branch via the UI without a codebase redeployment.
*   **Transactions**: All critical mass-insert operations (like parsing an Excel sheet of 500 students, or calculating 10 rooms of seating) are executed within `prisma.$transaction()`. If the server faults mid-operation, the entire transaction rolls back, guaranteeing zero orphaned or corrupted rows.

### 3.2 In-Memory Data Grid (Redis Cloud)
PostgreSQL handles truth, while Redis handles velocity and defense.
*   **API Hydration**: High-traffic static read endpoints (e.g., a student checking their profile on exam morning) query Redis first. If a cache hit occurs, the DB is bypassed, reducing latency from ~150ms to ~15ms and shielding Supabase from connection exhaustion. Cache keys are automatically invalidated on write operations (`cache.del()`).
*   **Rate Limit Subsystem**: Redis acts as the cluster-store for `express-rate-limit`, ensuring IP-bans and throttles are synchronized if the Node.js backend scales horizontally across multiple instances.

---

## 4. Core Algorithmic Modules (Backend Services)

The Node backend follows the Controller-Service architecture pattern to separate HTTP parsing from business logic.

### 4.1 Room & Capacity Allotment Engine (`room.service.js`)
*   Dynamically ingests total student counts belonging to specific `ExamGroups` (e.g. `SEM3-BTECH-REGULAR`).
*   Iterates through available physical rooms, calculating maximum volume and sequentially allocating students until the exam group is perfectly mapped.

### 4.2 Mathematical Seating Orchestrator (`seating.service.js`)
This is the most computationally complex service in the application.
*   **Department Interleaving**: It prevents students from the same department/branch from sitting adjacently. It implements a round-robin column-generator across multiple departments filling a room.
*   **Grid Padding**: Not all physical columns divide perfectly. The algorithm detects sparse columns and pads them with boolean `isExtra: true` ghost seats to maintain the frontend mapping grid UI integrity.

### 4.3 App Configuration (`settings.service.js`)
*   Manages runtime environment variables stored in DB (`maintenanceMode`, `sessionTimeout`, `noticeBoardMessage`). Changes propagate instantly to all connected clients without node restarts.

---

## 5. Multi-Layered Security Posture

The application adheres to a strict Zero-Trust model against both external traffic and internal module communication.

### 5.1 Authentication & Namespace Isolation
*   **Algorithm**: JSON Web Tokens (JWT) signed with a 128-char cryptographically random `JWT_SECRET` (`crypto.randomBytes(64)`).
*   **Strict Namespacing**: Cookies are segregated into `student_token` and `admin_token`. A compromised student JWT inherently cannot resolve an admin API route.
*   **Secure Delivery**: Tokens are issued exclusively via `HttpOnly`, `Secure`, `SameSite: Strict` cookies. They are mathematically immune to Cross-Site Scripting (XSS) extraction by malicious frontend code.
*   **Session Invalidation Engine**: Every JWT contains a UUID `sessionId`. This ID is mirrored in the DB. A new login or a password change overwrites the DB's `sessionId`. When the old JWT hits the middleware, the ID mismatch instantly rejects the request. (True remote logout).

### 5.2 Input Validation & Integrity
*   **Zod Runtime Parsing**: Every incoming payload is validated against strict object schemas. Extraneous or malformed fields throw an immediate HTTP 400, acting as a shield for the backend controllers.
*   **Whitelist Filtering**: Update endpoints utilize strict array whitelisting (`ALLOWED_KEYS`), ignoring arbitrary key injections.
*   **Prisma Parameterization**: SQL Injection is structurally impossible due to Prisma treating all inputs as parameterized strings.

### 5.3 Intelligent Rate Limiting
A tiered architecture built on Redis:
1.  **Auth Tier (Brute-Force Guard)**: Limits `/login` requests per IP (5 attempts / 15 mins).
2.  **Upload Tier (Resource Guard)**: Limits heavy PDF/CSV parsing operations strictly by the *Authenticated User's ID* (not IP), preventing an administrator from crashing the container via memory exhaustion (10 / hour).
3.  **General API Tier (DDoS Guard)**: Limits the aggregate API wildcard requests (300 / 15 mins).

### 5.4 Network & Middleware Defence
*   **Helmet.js**: Injects strict CSP (Content-Security-Policy), blocks X-Frame-Options (Clickjacking mitigation), and enforces same-origin Referrer Policies.
*   **CORS Strict Allowlist**: API blocks cross-origin requests originating outside the explicitly defined frontend URLs.
*   **Data Redaction**: `pino-http` intercepts terminal logging, physically preventing passwords, cookies, and tokens from being written to plain-text server stdout logs.
*   **Server-to-Server Bypasses**: Cron jobs and internal scripts utilize a 64-char `ADMIN_API_KEY` passed via HTTP headers bypassing JWT middleware. *This key is completely stripped from the frontend Vite configuration to prevent bundle-leakage.*

---

## 6. Frontend State Management & UI Architecture

### 6.1 Admin Web Dashboard
*   **Dual-Layer Auth Hook Guard**: `ProtectedRoute.jsx` relies on `sessionStorage` for instantaneous, flicker-free rendering, while simultaneously initiating asynchronous background JWT verification via `/dashboard/summary` to catch expired/invalidated tokens.
*   **Optimistic UI Updates**: Extensive usage of React hooks seamlessly updates UI state immediately on form submission resulting in a fluid UX, catching HTTP errors only as a fallback.

### 6.2 Student Web App
*   **Progressive Degradation**: Room assignments and Schedules aggressively cache to memory and SessionStorage. If the Node cluster enters maintenance mode or the student enters a physical Exam Hall with zero cellular reception, their previously cached seating assignment renders perfectly.
*   **Promise Concurrency**: During boot, the dashboard fetches profile details and global settings simultaneously via `Promise.allSettled()` / independent `.catch()` blocks. If the seating module crashes, the global notice board still renders.

---

## 7. Operational Observability
*   **UUID Tracing**: Every incoming network lifecycle is injected with a `X-Request-Id` UUID for granular log tracing across controllers down to the exact SQL query.
*   **Production Error Sanitization**: If the Prisma database engine enters a disconnected state, raw stack traces mapping database schemas are automatically stripped, throwing a generic HTTP 503 "Service Unavailable" response.
