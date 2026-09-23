SELECT * FROM ROLE;
SELECT * FROM PROJECT;
SELECT * FROM USER;


SELECT table_name
FROM user_tables
ORDER BY table_name;

SELECT
    table_name,
    column_id,
    column_name,
    data_type,
    data_length,
    nullable
FROM user_tab_columns
ORDER BY table_name, column_id;

--sqlplus RPMS_APP@localhost:1521/ORCLPDB 



SELECT
    a.table_name AS child_table,
    a.constraint_name AS fk_name,
    c_pk.table_name AS parent_table
FROM user_constraints a
JOIN user_constraints c_pk
    ON a.r_constraint_name = c_pk.constraint_name
WHERE a.constraint_type = 'R'
ORDER BY a.table_name, a.constraint_name;


SELECT
    fk.table_name AS child_table,
    fk.constraint_name AS fk_name,
    fkc.column_name AS fk_column,
    pk.table_name AS parent_table,
    pkc.column_name AS parent_column
FROM user_constraints fk
JOIN user_cons_columns fkc
    ON fk.constraint_name = fkc.constraint_name
JOIN user_constraints pk
    ON fk.r_constraint_name = pk.constraint_name
JOIN user_cons_columns pkc
    ON pk.constraint_name = pkc.constraint_name
   AND fkc.position = pkc.position
WHERE fk.constraint_type = 'R'
ORDER BY fk.table_name, fk.constraint_name, fkc.position;


SELECT
    table_name,
    constraint_name
FROM user_constraints
WHERE constraint_type = 'U'
ORDER BY table_name, constraint_name;


SELECT
    uc.table_name,
    uc.constraint_name,
    ucc.column_name,
    ucc.position
FROM user_constraints uc
JOIN user_cons_columns ucc
    ON uc.constraint_name = ucc.constraint_name
WHERE uc.constraint_type = 'U'
ORDER BY uc.table_name, uc.constraint_name, ucc.position;

SELECT
    table_name,
    constraint_name,
    search_condition
FROM user_constraints
WHERE constraint_type = 'C'
ORDER BY table_name, constraint_name;

SELECT
    index_name,
    table_name,
    column_name,
    column_position
FROM user_ind_columns
ORDER BY table_name, index_name, column_position;


SELECT
    table_name,
    constraint_name,
    constraint_type,
    search_condition
FROM user_constraints
WHERE constraint_type IN ('C','U')
ORDER BY table_name, constraint_name;

SELECT sequence_name
FROM user_sequences
ORDER BY sequence_name;



  SELECT PUBLICATION_ID, CONFIRMATION_STATUS FROM PUBLICATION
  WHERE CONFIRMATION_STATUS NOT IN ('Draft','Submitted','Under Review',
        'Revision Required','Resubmitted','Accepted','Rejected',
        'Published','Archived');


SELECT PRIVILEGE FROM DBA_SYS_PRIVS WHERE GRANTEE = 'RPMS_APP' ORDER BY PRIVILEGE;


-- to observe user info........
SELECT USER_ID, FULL_NAME, EMAIL, ROLE_ID FROM "USER" ORDER BY USER_ID;






-- comments for advance_sql
-- ================================================================
-- ADVANCED SQL
-- Every query here runs against your ACTUAL schema (post Blocks 2-7):
-- ROLE, USER (+INSTITUTION_ID), INSTITUTION, RESEARCH_AREA, VENUE,
-- PUBLICATION, AUTHOR_PUBLICATION (+AUTHOR_ORDER/IS_CORRESPONDING),
-- FILE, REVIEW, PROJECT, FUNDING_BODY, GRANT_FUNDING (+GRANT_DATE),
-- AWARD (+AWARD_DATE), MODERATION_QUEUE, NOTIFICATION,
-- USER_RESEARCH_AREA, PUBLICATION_RESEARCH_AREA, PROJECT_RESEARCH_AREA,
-- PROJECT_MEMBER.
--
-- These are all SELECTs — 100% safe to run right now, nothing is
-- modified. Most will return 0 rows until Block 14 loads real data;
-- that's expected, not a bug. Run this now just to confirm every
-- query is syntactically valid against your live schema.
--
--   sqlplus RPMS_APP/your_password@localhost:1521/ORCLPDB @advanced_queries.sql
-- ================================================================



-- ================================================================
--AUDIT LOG
-- Answers "who changed what, when, and what changed" for the 5 most
-- important tables: PUBLICATION, USER, REVIEW, PROJECT, GRANT_FUNDING.
--
-- CHANGED_BY uses the Oracle DB session user (the built-in USER
-- pseudo-column) — today that's always RPMS_APP, since the whole app
-- connects through one shared DB account. This still proves the audit
-- mechanism works end-to-end; getting per-END-USER attribution (so it
-- says "Manik Sarkar" instead of "RPMS_APP") requires the backend to
-- set a session context when it connects on someone's behalf — that's
-- a Block 15 (backend integration) enhancement, not a Block 13 one.
--
-- SECURITY RULE, followed strictly below: USER.PASSWORD is NEVER
-- written to AUDIT_LOG, in OLD_VALUE or NEW_VALUE, under any
-- circumstance — even though the trigger technically has access to it.
--
--   sqlplus RPMS_APP/your_password@localhost:1521/ORCLPDB @audit_log.sql
--   audit_log.sql: the AUDIT_LOG table plus 5 triggers covering PUBLICATION, USER, REVIEW, PROJECT, and GRANT_FUNDING.
--   Every INSERT/UPDATE/DELETE on those tables now leaves a trail — who (well, which DB account), when, and what changed.
-- ================================================================
-- Verify afterward:
--   SELECT trigger_name, status FROM user_triggers
--   WHERE trigger_name LIKE '%AUDIT%' ORDER BY trigger_name;
--   -- 5 rows, all ENABLED
--
-- Test it (use a real PROJECT_ID):
--   UPDATE PROJECT SET STATUS = 'Active' WHERE PROJECT_ID = 1;
--   SELECT * FROM AUDIT_LOG ORDER BY AUDIT_ID DESC FETCH FIRST 1 ROWS ONLY;
--   -- should show TABLE_NAME=PROJECT, ACTION_TYPE=UPDATE, OLD_VALUE
--   -- and NEW_VALUE showing the status change, CHANGED_BY=RPMS_APP
--
-- Confirm passwords are genuinely never captured, even on a real
-- password change:
--   UPDATE "USER" SET PASSWORD = 'some_new_bcrypt_hash_here' WHERE USER_ID = 1;
--   SELECT OLD_VALUE, NEW_VALUE FROM AUDIT_LOG
--   WHERE TABLE_NAME = 'USER' ORDER BY AUDIT_ID DESC FETCH FIRST 1 ROWS ONLY;
--   -- neither column will contain the password anywhere
-- ================================================================


-- ================================================================
--PK / FK / CONSTRAINTS / INDEXES
--
-- Run this AFTER schema.sql + seed.sql (safe to run on your current,
-- mostly-empty database — it only ADDS constraints/indexes, it does
-- not drop or rebuild any existing table).
--
--   sqlplus RPMS_APP/secretpass829845@localhost:1521/ORCLPDB @constraints_indexes.sql
--   login -> sqlplus RPMS_APP@localhost:1521/ORCLPDB 
--
-- What this does:
--   1. Adds CHECK constraints on free-text "status/type" columns that
--      currently accept ANY string (VENUE.STATUS, REVIEW.STATUS,
--      REVIEW.OVERALL_RECOMMENDATION, PROJECT.STATUS,
--      MODERATION_QUEUE.STATUS, MODERATION_QUEUE.ITEM_TYPE,
--      PUBLICATION.CONFIRMATION_STATUS).
--   2. Adds a few indexes on columns that will be filtered/sorted on
--      constantly (status columns, review deadline) but are not
--      already covered by the FK indexes in schema.sql.
--
-- Deliberately NOT doing here (comes in later blocks):
--   - Full publication lifecycle workflow (Block 6)
--   - Redesigning MODERATION_QUEUE's polymorphic ITEM_TYPE/REFERENCE_ID
--     (flagged in the master plan as its own decision, not a quick
--     constraint fix)
--   - Any new tables (Blocks 4/5)
-- ================================================================


-- ================================================================
-- FUNDING / AWARDS / INSTITUTIONS
--
-- Most of what this block is "supposed" to deliver (highest funded
-- project, funding by research area, institution rankings, etc.) is
-- pure SQL against relationships you already have from Blocks 2, 4
-- and 5 — that's real work, but it's Block 8 (Advanced SQL) work,
-- not a schema change. Adding tables here just to pad the block
-- count would go against the "don't overengineer" rule.
--
-- The one genuine structural gap: neither GRANT_FUNDING nor AWARD
-- has any date on it at all. Without a date, you literally cannot
-- write "funding trend by year" or "awards received this year" —
-- there's nothing to group by. This block fixes that, nothing else.
--
-- Purely additive, safe on your current data.
--   sqlplus RPMS_APP/your_password@localhost:1521/ORCLPDB @block7_funding_dates.sql
-- ================================================================


-- ================================================================
-- PL/SQL PROCEDURES & FUNCTIONS
--
-- These are standalone PL/SQL objects (not yet called by your Node
-- backend — that wiring is Block 15). Each PROCEDURE/FUNCTION ends
-- with a "/" on its own line, which SQL*Plus needs to compile it.
--
--   sqlplus RPMS_APP/your_password@localhost:1521/ORCLPDB @procedures_functions.sql
--
-- After each object, SHOW ERRORS prints any compile problems
-- immediately (it prints nothing if the object compiled cleanly).
-- ================================================================


-- ================================================================
-- PART A — PROCEDURES
-- ================================================================

-- ---- ASSIGN_REVIEWER ---------------------------------------------------
-- Validates everything BEFORE inserting: publication exists, reviewer
-- exists, reviewer is not one of the paper's own authors, deadline is
-- in the future. Duplicate assignment is caught via the existing
-- UQ_REVIEW_ASSIGNMENT constraint (Block 2/schema) rather than a
-- redundant manual check.
-- ================================================================
-- Verify afterward:
--   SELECT object_name, object_type, status FROM user_objects
--   WHERE object_type IN ('PROCEDURE','FUNCTION') ORDER BY object_name;
--   -- every STATUS should say VALID
--
-- Try the functions directly in a SELECT (use a real USER_ID you have):
--   SELECT GET_PUBLICATION_COUNT(1) FROM DUAL;
--   SELECT GET_RESEARCHER_PRODUCTIVITY(1) FROM DUAL;
--
-- Try a procedure with EXEC (use real IDs; pick a publication and a
-- DIFFERENT user who is NOT one of its authors):
--   EXEC ASSIGN_REVIEWER(1, 2, SYSDATE + 14);
--
-- Then prove the "no self-review" rule actually works — try assigning
-- one of the publication's own authors as reviewer instead. This
-- should FAIL with your custom -20003 error, not a generic Oracle one:
--   EXEC ASSIGN_REVIEWER(1, 1, SYSDATE + 14);  -- assuming USER_ID 1 authored PUBLICATION_ID 1
-- ================================================================
-- ================================================================
-- PROJECT MEMBERSHIP & COLLABORATION
--
-- PROJECT currently only has a single MANAGER_ID — no way for a
-- project to have multiple researchers on it. This adds that.
--
-- Purely additive: nothing existing is touched.
-- ================================================================
-- ================================================================
-- Verify afterward:
--
--   SELECT table_name FROM user_tables WHERE table_name = 'PROJECT_MEMBER';
--
-- Try it end to end (use real IDs from your data):
--   SELECT PROJECT_ID, TITLE FROM PROJECT;
--   SELECT USER_ID, FULL_NAME FROM "USER";
--
--   INSERT INTO PROJECT_MEMBER (PROJECT_ID, USER_ID, MEMBER_ROLE)
--   VALUES (1, 2, 'Researcher');
--
--   -- confirm the join works:
--   SELECT p.TITLE, u.FULL_NAME, pm.MEMBER_ROLE
--   FROM PROJECT_MEMBER pm
--   JOIN PROJECT p ON p.PROJECT_ID = pm.PROJECT_ID
--   JOIN "USER" u  ON u.USER_ID    = pm.USER_ID;
--
--   -- this should FAIL with ORA-00001 (unique constraint / duplicate PK),
--   -- proving a researcher can't be added twice to the same project:
--   INSERT INTO PROJECT_MEMBER (PROJECT_ID, USER_ID, MEMBER_ROLE)
--   VALUES (1, 2, 'Collaborator');
-- ================================================================

-- ================================================================
--PUBLICATION & PEER REVIEW WORKFLOW
--
-- Two things in this block:
--   1. Replace PUBLICATION's placeholder 4-value status check
--      (added in Block 2) with the real 9-state lifecycle.
--   2. Add author ORDER and CORRESPONDING-AUTHOR support to
--      AUTHOR_PUBLICATION, enforced properly (not just by convention).
--
-- NOT in this block (deliberately — needs cross-row logic that plain
-- CHECK constraints can't express, so it belongs in triggers/procedures):
--   - "A reviewer cannot review their own publication"
--   - "A publication can't move backward in the lifecycle"
-- ================================================================

-- ---- SAFETY CHECK — run this first, by itself -----------------------
-- The new lifecycle list below does NOT include the old placeholder
-- value 'Pending'. If this returns any rows, update them to 'Draft'
-- (or another valid new state) BEFORE running the ALTER below, or the
-- ALTER will fail with ORA-02293 rather than corrupt anything.
--
--   SELECT PUBLICATION_ID, CONFIRMATION_STATUS FROM PUBLICATION
--   WHERE CONFIRMATION_STATUS NOT IN ('Draft','Submitted','Under Review',
--         'Revision Required','Resubmitted','Accepted','Rejected',
--         'Published','Archived');
--
-- If that returns 0 rows (expected, since your PUBLICATION table is
-- still empty), continue below as-is.
-- ------------------------------------------------------------------

-- ================================================================
-- RESEARCH AREA RELATIONSHIPS + INSTITUTION LINK
--
-- Fixes the two gaps found in Block 3 (BLOCK3_NORMALIZATION.md):
--   1. INSTITUTION had zero incoming foreign keys.
--   2. RESEARCH_AREA had zero incoming foreign keys.
--
-- Safe to run on your current database: only ADDS a nullable column,
-- 3 new junction tables, and indexes. Nothing existing is dropped or
-- altered destructively — any USER/PUBLICATION/PROJECT rows you
-- already have stay exactly as they are (just with no research areas
-- or institution assigned yet, which you can fill in afterward).
-- ================================================================

-- ---- 1. Link USER to INSTITUTION -----------------------------------
-- One current institution per researcher is the realistic case here
-- (per BLOCK3_NORMALIZATION.md) — a plain FK column, not a full M:N
-- table. Nullable, since existing accounts have no institution yet.


-- ================================================================
--RICH SEED DATA
--
-- Uses your REAL USER_IDs (1, 21, 41, 42, 43, 44) — confirmed live
-- from your database, not guessed. Every other ID (publications,
-- reviews, projects, grants, awards, files) is captured via
-- RETURNING INTO as it's created and reused immediately below, so
-- this works correctly no matter what the actual identity values
-- turn out to be (your USER table already showed real gaps — this
-- script doesn't repeat that mistake).
--
-- VENUE/RESEARCH_AREA/INSTITUTION/FUNDING_BODY rows are looked up by
-- NAME rather than assumed ID, for the same reason.
--
-- Wrapped in one transaction: if anything fails partway, EVERYTHING
-- rolls back — you won't be left with half-seeded data to clean up.
--
--   sqlplus RPMS_APP/your_password@localhost:1521/ORCLPDB @seed_data.sql
--
-- Note: your audit triggers (Block 13) will fire automatically as
-- this runs — that's expected and good, AUDIT_LOG will already have
-- real rows in it afterward.
-- ================================================================

-- ================================================================
-- RPMS — BLOCK 12: TRANSACTIONS & CONCURRENCY
--
-- Two things:
--   1. CREATE_PUBLICATION_FULL — a genuinely multi-step operation
--      (publication + authors + research areas) that is atomic: if
--      ANY step fails, EVERYTHING rolls back, including steps that
--      already succeeded earlier in the same call.
--   2. ASSIGN_REVIEWER — re-created here with SELECT ... FOR UPDATE
--      added, fixing a real race condition: without it, two people
--      calling this at nearly the same time could both pass a
--      "under the review-count limit" check before either commits,
--      resulting in MORE reviewers than the limit allows. This is
--      the textbook case for row locking.
--
--   sqlplus RPMS_APP/your_password@localhost:1521/ORCLPDB @transactions.sql
-- ================================================================


-- ---- CREATE_PUBLICATION_FULL ---------------------------------------------
-- Demonstrates ATOMICITY: publication + every author + every research
-- area are inserted as ONE unit. p_author_ids and p_area_ids are
-- comma-separated ID lists (e.g. '3,5,9') — kept as plain VARCHAR2
-- rather than a custom collection TYPE, so it stays simple to call
-- with EXEC from plain SQL*Plus.
--
-- If anything fails partway (a bad author ID, a bad area ID, any
-- constraint violation) the EXCEPTION block below explicitly ROLLS
-- BACK — the publication that "succeeded" a moment earlier in this
-- same call is undone too. Nothing partial is ever left behind.