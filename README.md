

# RPMS — Research & Publication Management System

Full-stack application: React (Vite) frontend + Express/Node backend on Oracle Database.

```
project/
├── front/           React 19 + Vite 8 + Tailwind 4 + daisyUI
└── rpms-backend/    Express + node-oracledb
```

---

## 1. Prerequisites

| Requirement | Notes |
|---|---|
| Node.js 20+ | `node -v` |
| Oracle Database | Any edition (XE, Free, or full). Reachable on `host:port/service` |
| An Oracle schema user | e.g. `rpms_user`, with `CREATE TABLE` / `CREATE SEQUENCE` privileges |

`node-oracledb` runs in **Thin mode** by default and needs no Instant Client.
Thick mode is only required for Oracle Database 11.2 or older — set
`ORACLE_CLIENT_LIB_DIR` in `config/.env` if you need it.

---

## 2. Database setup

Run as your RPMS schema owner:

```bash
cd rpms-backend/database

# Optional: wipe an existing RPMS schema first
sqlplus rpms_user/your_password@localhost:1521/orcl @reset.sql

# Create the tables, constraints and indexes
sqlplus rpms_user/your_password@localhost:1521/orcl @schema.sql

# Insert the three required roles (+ optional demo venues/areas/institutions)
sqlplus rpms_user/your_password@localhost:1521/orcl @seed.sql
```

`seed.sql` is **not optional** — registration resolves `ROLE_ID` from the role
name, so `Admin`, `Manager` and `Researcher` must exist before anyone can sign up.

No user rows are seeded, because `USER.PASSWORD` stores a bcrypt hash.
Create your first account through the Register page.

---

## 3. Backend

```bash
cd rpms-backend
npm install

cp config/.env.example config/.env
# then edit config/.env with your real DB_USER / DB_PASSWORD /
# DB_CONNECTION_STRING and a long random JWT_SECRET

npm run dev     # nodemon, restarts on change
# or
npm start       # plain node
```

Backend listens on **http://localhost:5000**.

Verify the database wiring before touching the UI:

```bash
curl http://localhost:5000/api/health      # server is up
curl http://localhost:5000/api/health/db   # pool can reach Oracle
```

The server refuses to start if `DB_USER`, `DB_PASSWORD`,
`DB_CONNECTION_STRING` or `JWT_SECRET` are missing, and prints the reason.

### Common connect strings

| Setup | `DB_CONNECTION_STRING` |
|---|---|
| Oracle XE 18c/21c | `localhost:1521/XEPDB1` |
| Oracle Database 23ai Free | `localhost:1521/FREEPDB1` |
| Classic SID-style install | `localhost:1521/orcl` |

---

## 4. Frontend

```bash
cd front
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**.

No `.env` is needed for local development: the app calls relative `/api/...`
paths and `vite.config.js` proxies them to `http://localhost:5000`, so there
are no CORS issues. Copy `.env.example` to `.env` only if you need to change
the proxy target or point the build at a remote API.

Other scripts:

```bash
npm run build     # production build into dist/
npm run preview   # serve the production build
npm run lint      # eslint
```

---

## 5. API reference

Everything returns `{ success, message?, data? }`.
Protected routes need `Authorization: Bearer <token>`.

| Method | Endpoint | Auth |
|---|---|---|
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| GET | `/api/auth/me` | any |
| GET | `/api/roles` | public |
| GET | `/api/users`, `/api/users/:id` | any |
| PUT | `/api/users/:id` | self or Admin |
| GET | `/api/publications`, `/api/publications/:id` | public |
| POST / DELETE | `/api/publications`, `/api/publications/:id` | owner or Admin |
| GET / POST / DELETE | `/api/projects` | any / manager or Admin |
| GET | `/api/reviews` | any (own assignments) |
| POST | `/api/reviews` | Admin, Manager |
| PUT | `/api/reviews/:id/submit` | assigned reviewer |
| GET | `/api/venues` | public |
| POST | `/api/venues` | Admin, Manager |
| GET / POST / DELETE | `/api/institutions` | any / Admin+Manager / Admin |
| GET / POST / DELETE | `/api/research-areas` | any / Admin+Manager / Admin |
| GET / POST / DELETE | `/api/files` | any / owner / owner or Admin |
| GET / POST / DELETE | `/api/grants` | any / Admin+Manager |
| GET | `/api/grants/funding-bodies` | any |
| GET / POST / DELETE | `/api/awards` | any / self |
| GET / POST | `/api/notifications` | own |
| PUT | `/api/notifications/:id/read` | own |
| GET / PUT | `/api/moderation` | Admin |
| POST | `/api/moderation` | any |
| GET | `/api/health`, `/api/health/db` | public |

`?mine=true` on `/api/publications` and `/api/awards` limits results to the caller.

---

## 6. Roles

| Role | Extra access |
|---|---|
| Researcher | Publications, projects, own reviews, awards, notifications |
| Manager | + Grants & funding, venue creation, institutions, research areas, review assignment |
| Admin | + Moderation queue, may edit/delete any record |

Route guards in `src/components/auth/RoleGuard.jsx` mirror the backend's
`authorizeRole` middleware, so the UI never offers a page the API would reject.

---


---

## 🎯 Engineering Objectives & Database Enhancements

### 1. 📐 Data Modeling & Normalization
* **Strict Normalization (1NF to BCNF):** Standardized entity schemas across 15 core tables, eliminating partial/transitive dependencies and multi-valued attributes.
* **Many-to-Many (M:N) Relationship Refactoring:** Properly decoupled entities through bridge tables for multi-domain mappings:
  * `USER` ↔ `RESEARCH_AREA` via `USER_RESEARCH_AREA`
  * `PUBLICATION` ↔ `RESEARCH_AREA` via `PUBLICATION_RESEARCH_AREA`
  * `PROJECT` ↔ `USER` via `PROJECT_MEMBER` (with explicit role tracking and join dates)

### 2. 🔐 Schema Integrity & Relational Rules
* **Declarative Constraints:** Applied strict `PRIMARY KEY`, `FOREIGN KEY` (with standard cascade/nullification rules), `UNIQUE`, `NOT NULL`, and `CHECK` constraints across all tables.
* **Workflow Transition Guards:** Utilized `CHECK` constraints and PL/SQL state machine logic to enforce valid lifecycle transitions for publications:
  $$\text{Draft} \longrightarrow \text{Submitted} \longrightarrow \text{Under Review} \longrightarrow \text{Accepted/Rejected} \longrightarrow \text{Published}$$

### 3. ⚡ Advanced SQL & Analytic Engines
Implemented a dedicated query suite (`database/advanced_queries.sql`) leveraging native Oracle analytical and transactional capabilities:
* **Complex Multi-Table Joins:** Inner, Outer, Self, and Cross joins to aggregate collaboration networks.
* **Analytical Window Functions:** `ROW_NUMBER()`, `RANK()`, `DENSE_RANK()`, `LAG()`, and `LEAD()` with `PARTITION BY` clauses for productivity trend metrics.
* **Subqueries & Set Operations:** Correlated subqueries, `EXISTS`/`NOT EXISTS`, `UNION ALL`, `INTERSECT`, and `MINUS` operations for deep domain filtering.

### 4. ⚙️ Database-Level Business Logic (PL/SQL)
Shifted core application rules from the API layer into compiled Oracle PL/SQL modules to guarantee data integrity across any consumer interface:
* **Stored Procedures:** Autonomous execution blocks for critical actions (`ASSIGN_REVIEWER`, `SUBMIT_REVIEW`, `APPROVE_PUBLICATION`, `ADD_PROJECT_GRANT`).
* **Stored Functions:** Deterministic database functions to calculate metrics on-demand (e.g., Researcher Productivity Index, Total Funding Aggregations).
* **Database Triggers:**
  * **Event Notification Triggers:** Automatically generate system alerts upon key state changes (e.g., `REVIEW` completion).
  * **Validation Triggers:** Enforce business constraints prior to `INSERT`/`UPDATE` operations.

### 5. 📊 Native Reporting Views
Encapsulated multi-join analytics into pre-compiled database views for fast consumption by the Express API dashboard endpoints:
* `V_PUBLICATION_DETAILS` — Comprehensive metadata per research output.
* `V_RESEARCHER_STATISTICS` — Real-time productivity metrics per academic user.
* `V_PROJECT_FUNDING` — Active grant allocations, spent funds, and remaining budgets.
* `V_DASHBOARD_SUMMARY` — System-wide operational stats driving the React dashboard.

### 6. 🛡️ Enterprise Audit & Security Framework
* **Centralized Audit Trail (`AUDIT_LOG`):** Automated trigger-based auditing tracking `WHO`, `WHAT`, and `WHEN` across critical tables (`USER`, `PUBLICATION`, `REVIEW`, `GRANT_FUNDING`).
* **Field-Level Diffing:** Stores `OLD_VALUE` and `NEW_VALUE` states per transaction.
* **Zero-Trust Security:** Explicit exclusion of sensitive artifacts (plaintext passwords, OTPs, tokens, secrets) from all logging mechanisms.

### 7. 🔄 Transaction Control & Concurrency
* **ACID Guarantees:** Multi-statement operations wrapped in explicit transaction blocks utilizing `COMMIT` and `ROLLBACK` safety nets.
* **Row-Level Locking:** Targeted implementation of `SELECT ... FOR UPDATE` to resolve race conditions during concurrent reviewer assignments and status transitions.

---

## 📈 Database Capability Matrix

| Feature Domain | Implementation Mechanism | System Impact |
| :--- | :--- | :--- |
| **Data Integrity** | Foreign Keys, `CHECK` Constraints, Domain Rules | Zero orphaned records or invalid entity states |
| **Business Logic** | PL/SQL Stored Procedures & Functions | Single source of truth at DB level |
| **Automation** | Database Triggers | Real-time event tracking & automatic audit logging |
| **Performance** | B-Tree Indexes & Pre-compiled Views | Sub-millisecond aggregation queries for UI dashboards |
| **Auditability** | `AUDIT_LOG` + System Triggers | Complete mutation history with delta capture |

---

## 🚀 Execution & Verification Roadmap

- [x] **Block 1 & 2:** Database Audit, PK/FK Enforcements, & Constraint Verification
- [ ] **Block 3 & 4:** Schema Normalization & Research Area M:N Integration
- [ ] **Block 5 & 6:** Project Collaboration & Publication Workflow Lifecycle
- [ ] **Block 7 & 8:** Funding Calculations & Advanced SQL Analytics Suite
- [ ] **Block 9 & 10:** Compiled Views & PL/SQL Stored Procedures/Functions
- [ ] **Block 11 & 12:** Automated Triggers & Transaction/Concurrency Controls
- [ ] **Block 13 & 14:** Security Audit Trail & Rich Fictional Demo Dataset
- [ ] **Block 15 & 16:** API Integration & Live Database-Driven Frontend Dashboards


