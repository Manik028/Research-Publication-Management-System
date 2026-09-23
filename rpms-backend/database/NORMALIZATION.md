# RPMS — BLOCK 3: Normalization & Data Model Audit

This is an analysis pass only — **no schema changes in this file.**
Goal: verify the 15 existing tables are properly normalized, and
flag anything that needs fixing in a later block.

---

## Method

For each table: candidate key(s), functional dependencies (FDs), and
whether every non-key attribute depends on the *whole* key and
*nothing but* the key (2NF/3NF definition).

---

## Table-by-table

### ROLE
- PK: `ROLE_ID`. FDs: `ROLE_ID → ROLE_NAME, DESCRIPTION`.
- 1NF/2NF/3NF: OK. Single-column key, no partial/transitive dependency possible.

### USER
- PK: `USER_ID`. FDs: `USER_ID → FULL_NAME, EMAIL, PASSWORD, DEPARTMENT, ORCID, TWO_FACTOR_ENABLED, ROLE_ID`.
- 3NF: OK — every attribute depends only on `USER_ID`.
- **Gap (not a normalization violation, a missing relationship):** there is no `INSTITUTION_ID` column or FK anywhere in the schema. `INSTITUTION` exists as a table but nothing references it. `DEPARTMENT` is free text on `USER`, which is fine on its own, but it can't answer "which institution is this researcher at" or "publications by institution" — because that link doesn't exist at all yet.

### INSTITUTION
- PK: `INSTITUTION_ID`. FDs: `INSTITUTION_ID → NAME, COUNTRY, WEBSITE`.
- 3NF: OK in isolation.
- **Gap: fully orphaned table.** No other table has a foreign key to it. This is more than "not normalized" — it's an entity with zero relationships, so it can't currently be queried against anything else. → **Block 4 must add `USER.INSTITUTION_ID` (or an `INSTITUTION_ID` FK) at minimum.**

### RESEARCH_AREA
- PK: `AREA_ID`. FDs: `AREA_ID → AREA_NAME, DESCRIPTION`.
- 3NF: OK in isolation.
- **Gap: same problem as INSTITUTION** — no junction table connects it to `USER`, `PUBLICATION`, or `PROJECT`. This was already called out in the original master plan (Block 4 is designed specifically to fix it with `USER_RESEARCH_AREA` / `PUBLICATION_RESEARCH_AREA`).

### VENUE
- PK: `VENUE_ID`. FDs: `VENUE_ID → NAME, TYPE, SUBMISSION_DEADLINE, STATUS`.
- 3NF: OK.

### PUBLICATION
- PK: `PUBLICATION_ID`. FDs: `PUBLICATION_ID → TITLE, ABSTRACT, DOI, SUBMISSION_DATE, TOTAL_VIEWS, TOTAL_DOWNLOADS, CONFIRMATION_STATUS, VENUE_ID, USER_ID`.
- 3NF: technically OK — nothing here is transitively dependent on a non-key attribute.
- **Design note (not a normalization violation, but worth flagging):** `TOTAL_VIEWS`/`TOTAL_DOWNLOADS` are mutable counters, not derived from any event log — there's no way to answer "views in the last 30 days" or audit whether the counter is even correct. The master plan already proposes `PUBLICATION_VIEW`/`PUBLICATION_DOWNLOAD` event tables for this — that's Block 8/14 territory, not Block 3, so no change here yet.
- One publication has exactly one `USER_ID` "owner" *and* a separate `AUTHOR_PUBLICATION` table for the full author list — this isn't redundant, `USER_ID` here reads as "submitter," `AUTHOR_PUBLICATION` as the full authorship list. Worth confirming that's the intended meaning when we get to Block 6 (publication lifecycle), since two different "who owns this" concepts living side by side can cause bugs if the frontend/backend disagree about which one is authoritative.

### AUTHOR_PUBLICATION
- Composite PK: `(USER_ID, PUBLICATION_ID)`. FD: `(USER_ID, PUBLICATION_ID) → AUTHOR_ROLE`.
- 2NF: OK — `AUTHOR_ROLE` depends on the *combination*, not on either column alone (a role like "Primary" only makes sense for that specific author on that specific paper).
- Genuinely clean M:N junction table already. No author-order or corresponding-author column yet — flagged for Block 6, not a normalization issue.

### FILE
- PK: `FILE_ID`. FDs: `FILE_ID → FILE_NAME, FILE_TYPE, FILE_SIZE, UPLOAD_DATE, PUBLICATION_ID`.
- 3NF: OK.

### REVIEW
- PK: `REVIEW_ID`. FDs: `REVIEW_ID → SCORE, ORIGINALITY, OVERALL_RECOMMENDATION, COMMENTS_AUTHOR, COMMENTS_EDITOR, DEADLINE, STATUS, PUBLICATION_ID, REVIEWER_ID`.
- 3NF: OK. `UQ_REVIEW_ASSIGNMENT (PUBLICATION_ID, REVIEWER_ID)` correctly prevents the same reviewer being assigned twice — that's a constraint concern (handled in Block 2), not a normalization one.

### PROJECT
- PK: `PROJECT_ID`. FDs: `PROJECT_ID → TITLE, STATUS, TIMELINE, BUDGET, MANAGER_ID`.
- 3NF: OK.
- **Design note:** `TIMELINE VARCHAR2(100)` is free text (e.g. "Jan 2026 – Dec 2026"). This isn't a normalization violation — it still depends only on `PROJECT_ID` — but it's not queryable ("projects ending this quarter" can't be a WHERE clause on free text). Worth splitting into `START_DATE`/`END_DATE` at some point; low priority, can fold into Block 4 or 5 if you want it done alongside `PROJECT_MEMBER`.

### FUNDING_BODY
- PK: `BODY_ID`. FDs: `BODY_ID → NAME, ORGANIZATION_TYPE`. 3NF: OK.

### GRANT_FUNDING
- PK: `GRANT_ID`. FDs: `GRANT_ID → AMOUNT, PROJECT_ID, BODY_ID`. 3NF: OK. Correctly modeled as its own entity (not a composite PK on `PROJECT_ID+BODY_ID`) since a project can receive multiple grants from the same body over time — good design already.

### AWARD
- PK: `AWARD_ID`. FDs: `AWARD_ID → AWARD_NAME, CATEGORY, AWARDING_ORGANIZATION, USER_ID`. 3NF: OK.

### MODERATION_QUEUE
- PK: `MOD_ID`. FDs: `MOD_ID → ITEM_TYPE, REFERENCE_ID, FLAG_REASON, STATUS, ACTION_TAKEN`.
- 3NF (textbook definition): technically satisfied — no non-key attribute depends on another non-key attribute.
- **Real problem is referential integrity, not normalization:** `REFERENCE_ID` is a "foreign key" in spirit only — Oracle can't enforce it as a real FK because it might point into `PUBLICATION`, `REVIEW`, or `USER` depending on what `ITEM_TYPE` says. Nothing stops `REFERENCE_ID = 99999` pointing at nothing. This was already flagged in the original master plan (item 18) as a design decision to make later, not a quick fix — leaving as-is for now.

### NOTIFICATION
- PK: `NOTIF_ID`. FDs: `NOTIF_ID → CATEGORY, MESSAGE, IS_READ, CREATED_AT, USER_ID`. 3NF: OK.

---

## Summary — what Block 3 actually found

**Good news:** 13 of 15 tables are already clean 3NF with no partial or
transitive dependencies. The schema wasn't built carelessly — this is
a solid foundation.

**Two real relationship gaps, both already anticipated by Block 4:**
1. `INSTITUTION` has zero incoming foreign keys — completely disconnected from the rest of the schema.
2. `RESEARCH_AREA` has zero incoming foreign keys — same problem.

**Two minor design notes, not blockers, deferred to later blocks:**
3. `PUBLICATION.TOTAL_VIEWS/TOTAL_DOWNLOADS` are mutable counters with no backing event log (Block 8/14).
4. `PROJECT.TIMELINE` is unstructured text instead of real dates (optional, can be folded into Block 5).

**No BCNF violations found** — every table has a single, simple determinant
key, so BCNF and 3NF coincide here; there's no case of a non-candidate-key
attribute determining part of the key.

---

## What happens next (Block 4)

Block 4 will add the connecting tables for gap #1 and #2:
- `USER.INSTITUTION_ID` (FK to `INSTITUTION`) — or, if you'd rather a
  researcher could historically belong to more than one institution,
  a proper `USER_INSTITUTION` M:N table instead of a single column.
  Default plan: a single FK column, since one *current* institution
  per researcher is the realistic case for this app.
- `USER_RESEARCH_AREA` (M:N between `USER` and `RESEARCH_AREA`)
- `PUBLICATION_RESEARCH_AREA` (M:N between `PUBLICATION` and `RESEARCH_AREA`)
