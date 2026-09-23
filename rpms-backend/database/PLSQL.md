# RPMS — PLSQL.md

Documents every procedure, function, and trigger, and how exceptions and
transactions are handled throughout.

## Procedures (`procedures_functions.sql`, `transactions.sql`)

| Procedure | Validates | On success |
|---|---|---|
| ASSIGN_REVIEWER(pub_id, reviewer_id, deadline) | Publication & reviewer exist; reviewer isn't an author; deadline is future; ≤3 reviewers already (Block 12); locks the publication row (`FOR UPDATE`) to prevent a race condition | Inserts REVIEW row, status Pending |
| SUBMIT_REVIEW(review_id, reviewer_id, score, ...) | Review exists; belongs to this reviewer; still Pending | Updates REVIEW, status Completed (fires TRG_REVIEW_COMPLETED_NOTIFY) |
| APPROVE_PUBLICATION(pub_id) | Publication exists; status is Under Review/Resubmitted | Status → Accepted |
| REJECT_PUBLICATION(pub_id) | Same as above | Status → Rejected |
| ADD_PROJECT_GRANT(project_id, body_id, amount) | Project & funding body exist; amount > 0 | Inserts GRANT_FUNDING |
| ADD_PROJECT_MEMBER(project_id, user_id, role) | Project & user exist; not already a member (PK) | Inserts PROJECT_MEMBER |
| CREATE_PUBLICATION_FULL(...) | — | Atomically inserts publication + all authors + all research areas; explicit ROLLBACK on any failure (Block 12 atomicity demo) |

Every procedure validates *before* writing, and uses `RAISE_APPLICATION_ERROR`
with a distinct code (-20001 to -20099) so the backend gets a specific,
readable reason rather than a generic Oracle error.

## Functions (`procedures_functions.sql`)

| Function | Returns |
|---|---|
| GET_PUBLICATION_COUNT(user_id) | Number of publications authored |
| GET_RESEARCHER_PRODUCTIVITY(user_id) | Weighted score: pubs×3 + projects×2 + awards×1 (documented formula, easy to adjust) |
| GET_PROJECT_TOTAL_FUNDING(project_id) | Sum of all grants |
| GET_AVERAGE_REVIEW_SCORE(pub_id) | Average of non-null review scores (NULL if none yet — correct, not an error) |
| GET_RESEARCHER_PROJECT_COUNT(user_id) | Number of projects the user is a member of |
| GET_INSTITUTION_PUBLICATION_COUNT(institution_id) | Publications by researchers at that institution |
| GET_RESEARCH_AREA_PUBLICATION_COUNT(area_id) | Publications tagged with that area |

All 7 are callable directly inside a `SELECT`, e.g.
`SELECT GET_PUBLICATION_COUNT(1) FROM DUAL;`

**Known gotcha documented in-file:** parameters that identify a user use
`p_user_id IN NUMBER`, not `"USER".USER_ID%TYPE`. `USER` is a reserved
PL/SQL pseudo-function (returns the current DB session's username) as well
as a table name, and the compiler rejects the `%TYPE` anchor even when the
table name is quoted (`PLS-00225`). `NUMBER` is exactly what `USER_ID` is
anyway, so this sidesteps the conflict.

## Triggers (`triggers.sql`, `audit_log.sql`)

| Trigger | Fires on | Does |
|---|---|---|
| TRG_REVIEW_COMPLETED_NOTIFY | REVIEW.STATUS → Completed | Inserts a NOTIFICATION for the publication owner |
| TRG_PUBLICATION_STATUS_GUARD | UPDATE of PUBLICATION.CONFIRMATION_STATUS | Enforces the 9-state lifecycle's legal transitions; refuses invalid jumps (e.g. Draft → Published) regardless of what wrote the UPDATE |
| TRG_PUBLICATION_AUDIT / TRG_USER_AUDIT / TRG_REVIEW_AUDIT / TRG_PROJECT_AUDIT / TRG_GRANT_FUNDING_AUDIT | INSERT/UPDATE/DELETE on each table | Writes an AUDIT_LOG row (old value, new value, who, when). TRG_USER_AUDIT never includes PASSWORD |

No trigger recursion: audit triggers only INSERT into AUDIT_LOG (a
different table), so there's no mutating-table risk (`ORA-04091`).
Two triggers can coexist on the same table/event (e.g. PUBLICATION has both
the status guard and the audit trigger) — Oracle fires all of them.

## Exception Handling

Every procedure uses `RAISE_APPLICATION_ERROR` for expected business-rule
violations (predictable, named error codes) and lets genuinely unexpected
errors propagate with full `SQLERRM` detail inside `CREATE_PUBLICATION_FULL`'s
`WHEN OTHERS` handler — never silently swallowed. `NO_DATA_FOUND` is
caught explicitly wherever a row's existence is being validated, rather
than being allowed to surface as a raw Oracle error to the caller.

## Transactions & Concurrency (`transactions.sql`)

- **Atomicity:** `CREATE_PUBLICATION_FULL` inserts a publication + N authors
  + N research areas as one unit. Any failure (e.g. a bad research-area ID)
  triggers an explicit `ROLLBACK`, undoing every insert in that call —
  even ones that "succeeded" moments earlier in the same transaction.
- **Isolation / concurrency:** `ASSIGN_REVIEWER` uses `SELECT ... FOR UPDATE`
  on the publication row before checking the reviewer-count cap. This closes
  a real race condition: without the lock, two nearly-simultaneous calls
  could each pass the "under 3 reviewers" check before either commits,
  resulting in 4+ reviewers. The lock forces the second caller to wait.
- **Durability:** every successful procedure ends with an explicit `COMMIT`.
