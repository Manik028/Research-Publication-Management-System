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

## 7. Troubleshooting

**`ORA-12541: TNS:no listener`** — the database isn't running or the port is
wrong. Check with `lsnrctl status`.

**`ORA-01017: invalid username/password`** — wrong `DB_USER`/`DB_PASSWORD`.
Note that a password containing `#` will be read as a comment by some `.env`
parsers; quote it if needed.

**`ORA-00942: table or view does not exist`** — `schema.sql` hasn't been run,
or it was run as a different schema user than the one in `config/.env`.

**"Invalid role specified" on register** — `seed.sql` hasn't been run.

**Frontend loads but every request fails** — the backend isn't running on port
5000. Check `curl http://localhost:5000/api/health`.

