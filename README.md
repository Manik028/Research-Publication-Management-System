# RPMS — Research & Publication Management System

Full-stack application: React (Vite) frontend + Express/Node backend on Oracle Database.

```
project/
├── front/           React 19 + Vite 8 + Tailwind 4 + daisyUI
└── rpms-backend/    Express + node-oracledb
```

A BUET CSE 216 (Database Management Systems) project — the Oracle database is
the primary deliverable: normalized schema, constraints, views, PL/SQL
procedures/functions, triggers, transactions/rollback, and an audit log all
sit behind the application layer described below.

---

## 1. Prerequisites

| Requirement | Notes |
|---|---|
| Node.js 20+ | `node -v` |
| Oracle Database | Any edition (XE, Free, or full). Reachable on `host:port/service` |
| An Oracle schema user | e.g. `rpms_user`, with `CREATE TABLE` / `CREATE SEQUENCE` privileges |
| A DBA account (SYSTEM/SYS) | One-time only, to grant `CREATE VIEW` / `CREATE PROCEDURE` / `CREATE TRIGGER` to the schema user (see §2) |

`node-oracledb` runs in **Thin mode** by default and needs no Instant Client.
Thick mode is only required for Oracle Database 11.2 or older — set
`ORACLE_CLIENT_LIB_DIR` in `config/.env` if you need it.

---

## 2. Database setup

All database work lives in `rpms-backend/database/`. Run each file **in this
exact order** as your RPMS schema owner (e.g. `RPMS_APP`), except step 0,
which needs a DBA account:

```bash
cd rpms-backend/database

# 0. ONE TIME ONLY, connected as SYSTEM/SYS (not your schema user!) —
#    grants the privileges a plain schema user doesn't get automatically.
sqlplus SYSTEM/your_sys_password@localhost:1521/ORCLPDB @grant_privileges.sql

# 1-2. Base schema + required lookup data
sqlplus RPMS_APP/your_password@localhost:1521/ORCLPDB @schema.sql
sqlplus RPMS_APP/your_password@localhost:1521/ORCLPDB @seed.sql

# 3-13. Constraints, relationships, advanced SQL, views, PL/SQL, triggers,
#       transactions, audit log — run in order, each is independent once
#       the ones before it have succeeded:
@constraints_indexes.sql
@research_areas_institution.sql
@project_member.sql
@publication_workflow.sql
@funding_dates.sql
@advanced_queries.sql
@views.sql
@procedures_functions.sql
@triggers.sql
@transactions.sql
@audit_log.sql

# 14. Rich demo data — publications, reviews, projects, grants, awards,
#     using real registered USER_IDs (see note below)
@seed_data.sql

# Phase 9 — password recovery / OTP / 2FA support
@password_security.sql

# Optional — a clean, numbered sequence for a live teacher demo
@demo_queries.sql
```

`reset.sql` drops every RPMS object so you can start over from step 1.

**`seed.sql` is not optional** — registration resolves `ROLE_ID` from the role
name, so `Admin`, `Manager` and `Researcher` must exist before anyone can sign up.

**No user rows are seeded by `seed.sql`**, because `USER.PASSWORD` stores a
bcrypt hash that only the app can generate. Create your first few accounts
(with a mix of Admin/Manager/Researcher roles) through the Register page
*before* running `seed_data.sql`, which needs their real `USER_ID`s.

### Documentation

| File | Contents |
|---|---|
| `database/README.md` | Master install order (mirrors this section) |
| `database/NORMALIZATION.md` | Table-by-table functional-dependency audit, 1NF–3NF/BCNF |
| `database/DATABASE_DESIGN.md` | Entities, keys, constraints, indexing, design decisions |
| `database/ADVANCED_SQL.md` | Every query in `advanced_queries.sql` explained (joins, subqueries, set ops, CTEs, analytic functions) |
| `database/PLSQL.md` | Every procedure/function/trigger, exception handling, transaction behavior |

### What the database actually contains

- **19 tables**: the original 15 (`ROLE`, `USER`, `INSTITUTION`, `RESEARCH_AREA`,
  `VENUE`, `PUBLICATION`, `AUTHOR_PUBLICATION`, `FILE`, `REVIEW`, `PROJECT`,
  `FUNDING_BODY`, `GRANT_FUNDING`, `AWARD`, `MODERATION_QUEUE`,
  `NOTIFICATION`) plus `USER_RESEARCH_AREA`, `PUBLICATION_RESEARCH_AREA`,
  `PROJECT_RESEARCH_AREA`, `PROJECT_MEMBER`, `AUDIT_LOG`, and `AUTH_OTP`.
- **7 views**: `V_PUBLICATION_DETAILS`, `V_RESEARCHER_STATISTICS`,
  `V_PROJECT_FUNDING`, `V_REVIEW_STATISTICS`, `V_INSTITUTION_STATISTICS`,
  `V_RESEARCH_AREA_STATISTICS`, `V_DASHBOARD_SUMMARY`.
- **PL/SQL**: `ASSIGN_REVIEWER` (with row-locking + a 3-reviewer cap),
  `SUBMIT_REVIEW`, `APPROVE_PUBLICATION`, `REJECT_PUBLICATION`,
  `ADD_PROJECT_GRANT`, `ADD_PROJECT_MEMBER`, `CREATE_PUBLICATION_FULL`
  (atomic multi-step insert), `RESET_PASSWORD`, plus 7 stats functions
  usable directly inside `SELECT`.
- **Triggers**: publication lifecycle guard, review-completed
  notifications, and audit triggers on `PUBLICATION`, `USER`, `REVIEW`,
  `PROJECT`, `GRANT_FUNDING` (passwords are never written to `AUDIT_LOG`
  under any circumstance).
- **25 advanced queries** covering every required SQL category (self/full
  outer joins, correlated subqueries, `EXISTS`/`IN`/`ALL`, set operations,
  a CTE, `RANK`/`LAG`/running totals).

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

### Email (password reset & 2FA codes)

Optional. If `SMTP_HOST` is left unset in `config/.env`, OTP codes are
printed to the **backend terminal** instead of being emailed — fine for
local testing. For real delivery, set in `config/.env`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=RPMS <no-reply@yourdomain.com>
```

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

**Theming:** the app is pinned to a single light theme (`front/src/index.css`
configures daisyUI with `themes: light --default --prefersdark`, and
`index.html` sets `data-theme="light"` directly). The Settings page still has
a theme picker UI, but it currently always applies light regardless of what's
selected — every page was designed and tested against this one theme only, so
this is intentional, not a bug, until a real second theme gets built.

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
| POST | `/api/auth/verify-2fa` | public (2nd step of login when 2FA is enabled) |
| POST | `/api/auth/forgot-password` | public (always returns the same generic response) |
| POST | `/api/auth/reset-password` | public (email + OTP + new password) |
| PUT | `/api/auth/change-password` | authenticated (knows current password) |
| PUT | `/api/auth/two-factor` | authenticated (enable/disable for own account) |
| GET | `/api/auth/me` | any |
| GET | `/api/dashboard` | any (one query via `V_DASHBOARD_SUMMARY`) |
| GET | `/api/roles` | public |
| GET | `/api/users`, `/api/users/:id` | any |
| PUT | `/api/users/:id` | self or Admin |
| GET | `/api/publications`, `/api/publications/:id` | public |
| POST / DELETE | `/api/publications`, `/api/publications/:id` | owner or Admin |
| PUT | `/api/publications/:id/approve`, `/:id/reject` | Admin, Manager (DB refuses unless status is Under Review/Resubmitted) |
| GET / POST / DELETE | `/api/projects` | any / manager or Admin |
| GET | `/api/reviews` | any (own assignments) |
| POST | `/api/reviews` | Admin, Manager (calls `ASSIGN_REVIEWER`) |
| PUT | `/api/reviews/:id/submit` | assigned reviewer (calls `SUBMIT_REVIEW`) |
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

Business-rule violations raised by PL/SQL (self-review, duplicate
assignment, invalid status transitions, the 3-reviewer cap, etc.) are
translated by `utils/plsqlErrors.js` into a clean `400` with a readable
message, instead of a raw `500`.

---

## 6. Roles

| Role | Extra access |
|---|---|
| Researcher | Publications, projects, own reviews, awards, notifications |
| Manager | + Grants & funding, venue creation, institutions, research areas, review assignment, publication approve/reject |
| Admin | + Moderation queue, may edit/delete any record, publication approve/reject |

Route guards in `src/components/auth/RoleGuard.jsx` mirror the backend's
`authorizeRole` middleware, so the UI never offers a page the API would reject.

---

## 7. Security

- Passwords are bcrypt-hashed (never stored or logged in plaintext).
- Password policy (registration, reset, and change-password all enforce
  the same rule): 8+ characters, upper + lower + number + special
  character.
- **Forgot password**: 6-digit OTP, generated with `crypto.randomInt`
  (never `Math.random`), bcrypt-hashed before storage, expires in 10
  minutes, max 5 attempts, single active code per user (requesting a new
  one invalidates the last), 60s resend cooldown. The raw code is never
  written to any table, log, or `AUDIT_LOG` entry.
- **2FA**: optional per-account (toggle in Settings). When enabled, login
  requires a second emailed-code step before a JWT is issued — a real
  second factor, not just a stored boolean.
- **Session invalidation on password change**: every JWT embeds the
  timestamp of the user's most recent password change; `authMiddleware`
  checks that timestamp against the live database value on every request,
  so resetting or changing a password immediately invalidates every
  other already-issued token — not just the current one.
- `AUDIT_LOG` (via triggers on `USER`, `PUBLICATION`, `REVIEW`, `PROJECT`,
  `GRANT_FUNDING`) never records the `PASSWORD` column, under any
  circumstance, even though the trigger body technically has access to it.

---





