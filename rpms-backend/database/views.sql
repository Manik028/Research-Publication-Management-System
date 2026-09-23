-- ================================================================
--ORACLE VIEWS
-- Wraps the relationships built in Blocks 2-8 into reusable, named
-- database objects. Once these exist, "SELECT * FROM V_WHATEVER"
-- replaces repeating the same 4-table join every time — and in
-- Block 15, your Express backend can query these directly instead
-- of recomputing statistics in JavaScript.
--
-- Pure CREATE OR REPLACE VIEW statements — nothing existing is
-- touched, views auto-commit as DDL, completely safe to run.
--   sqlplus RPMS_APP/your_password@localhost:1521/ORCLPDB @views.sql
-- ================================================================

-- ---- V_PUBLICATION_DETAILS -------------------------------------------
-- One row per publication with authors and research areas flattened
-- into readable lists (LISTAGG), plus live review stats.
CREATE OR REPLACE VIEW V_PUBLICATION_DETAILS AS
SELECT
    p.PUBLICATION_ID,
    p.TITLE,
    p.DOI,
    p.SUBMISSION_DATE,
    p.CONFIRMATION_STATUS,
    p.TOTAL_VIEWS,
    p.TOTAL_DOWNLOADS,
    v.NAME AS VENUE_NAME,
    v.TYPE AS VENUE_TYPE,
    (SELECT LISTAGG(u.FULL_NAME, ', ') WITHIN GROUP (ORDER BY ap.AUTHOR_ORDER)
     FROM AUTHOR_PUBLICATION ap JOIN "USER" u ON u.USER_ID = ap.USER_ID
     WHERE ap.PUBLICATION_ID = p.PUBLICATION_ID) AS AUTHORS,
    (SELECT LISTAGG(ra.AREA_NAME, ', ') WITHIN GROUP (ORDER BY ra.AREA_NAME)
     FROM PUBLICATION_RESEARCH_AREA pra JOIN RESEARCH_AREA ra ON ra.AREA_ID = pra.AREA_ID
     WHERE pra.PUBLICATION_ID = p.PUBLICATION_ID) AS RESEARCH_AREAS,
    (SELECT ROUND(AVG(r.SCORE), 2) FROM REVIEW r
     WHERE r.PUBLICATION_ID = p.PUBLICATION_ID AND r.SCORE IS NOT NULL) AS AVG_REVIEW_SCORE,
    (SELECT COUNT(*) FROM REVIEW r WHERE r.PUBLICATION_ID = p.PUBLICATION_ID) AS REVIEW_COUNT
FROM PUBLICATION p
LEFT JOIN VENUE v ON v.VENUE_ID = p.VENUE_ID;


-- ---- V_RESEARCHER_STATISTICS -------------------------------------------
-- One row per researcher: publications, projects, awards, reviews done.
CREATE OR REPLACE VIEW V_RESEARCHER_STATISTICS AS
SELECT
    u.USER_ID,
    u.FULL_NAME,
    u.DEPARTMENT,
    i.NAME AS INSTITUTION_NAME,
    COUNT(DISTINCT ap.PUBLICATION_ID) AS PUBLICATION_COUNT,
    COUNT(DISTINCT pm.PROJECT_ID)     AS PROJECT_COUNT,
    COUNT(DISTINCT aw.AWARD_ID)       AS AWARD_COUNT,
    COUNT(DISTINCT CASE WHEN rv.STATUS = 'Completed' THEN rv.REVIEW_ID END) AS REVIEWS_COMPLETED
FROM "USER" u
LEFT JOIN INSTITUTION i          ON i.INSTITUTION_ID = u.INSTITUTION_ID
LEFT JOIN AUTHOR_PUBLICATION ap  ON ap.USER_ID = u.USER_ID
LEFT JOIN PROJECT_MEMBER pm      ON pm.USER_ID = u.USER_ID
LEFT JOIN AWARD aw               ON aw.USER_ID = u.USER_ID
LEFT JOIN REVIEW rv              ON rv.REVIEWER_ID = u.USER_ID
GROUP BY u.USER_ID, u.FULL_NAME, u.DEPARTMENT, i.NAME;


-- ---- V_PROJECT_FUNDING -------------------------------------------------
-- One row per project: total funding received and remaining budget.
CREATE OR REPLACE VIEW V_PROJECT_FUNDING AS
SELECT
    p.PROJECT_ID,
    p.TITLE,
    p.STATUS,
    p.BUDGET,
    NVL(SUM(gf.AMOUNT), 0) AS TOTAL_FUNDING,
    p.BUDGET - NVL(SUM(gf.AMOUNT), 0) AS REMAINING_BUDGET,
    COUNT(DISTINCT gf.BODY_ID) AS FUNDING_BODY_COUNT
FROM PROJECT p
LEFT JOIN GRANT_FUNDING gf ON gf.PROJECT_ID = p.PROJECT_ID
GROUP BY p.PROJECT_ID, p.TITLE, p.STATUS, p.BUDGET;


-- ---- V_REVIEW_STATISTICS ------------------------------------------------
-- One row per reviewer: workload, completion rate, overdue count.
CREATE OR REPLACE VIEW V_REVIEW_STATISTICS AS
SELECT
    u.USER_ID AS REVIEWER_ID,
    u.FULL_NAME AS REVIEWER_NAME,
    COUNT(r.REVIEW_ID) AS TOTAL_ASSIGNED,
    SUM(CASE WHEN r.STATUS = 'Completed' THEN 1 ELSE 0 END) AS COMPLETED,
    SUM(CASE WHEN r.STATUS = 'Pending' AND r.DEADLINE < SYSDATE THEN 1 ELSE 0 END) AS OVERDUE,
    ROUND(AVG(r.SCORE), 2) AS AVG_SCORE_GIVEN
FROM "USER" u
JOIN REVIEW r ON r.REVIEWER_ID = u.USER_ID
GROUP BY u.USER_ID, u.FULL_NAME;


-- ---- V_INSTITUTION_STATISTICS -------------------------------------------
CREATE OR REPLACE VIEW V_INSTITUTION_STATISTICS AS
SELECT
    i.INSTITUTION_ID,
    i.NAME,
    COUNT(DISTINCT u.USER_ID) AS RESEARCHER_COUNT,
    COUNT(DISTINCT ap.PUBLICATION_ID) AS PUBLICATION_COUNT
FROM INSTITUTION i
LEFT JOIN "USER" u ON u.INSTITUTION_ID = i.INSTITUTION_ID
LEFT JOIN AUTHOR_PUBLICATION ap ON ap.USER_ID = u.USER_ID
GROUP BY i.INSTITUTION_ID, i.NAME;


-- ---- V_RESEARCH_AREA_STATISTICS -----------------------------------------
CREATE OR REPLACE VIEW V_RESEARCH_AREA_STATISTICS AS
SELECT
    ra.AREA_ID,
    ra.AREA_NAME,
    COUNT(DISTINCT pra.PUBLICATION_ID) AS PUBLICATION_COUNT,
    COUNT(DISTINCT ura.USER_ID)        AS RESEARCHER_COUNT,
    COUNT(DISTINCT pjra.PROJECT_ID)    AS PROJECT_COUNT
FROM RESEARCH_AREA ra
LEFT JOIN PUBLICATION_RESEARCH_AREA pra ON pra.AREA_ID = ra.AREA_ID
LEFT JOIN USER_RESEARCH_AREA ura        ON ura.AREA_ID = ra.AREA_ID
LEFT JOIN PROJECT_RESEARCH_AREA pjra    ON pjra.AREA_ID = ra.AREA_ID
GROUP BY ra.AREA_ID, ra.AREA_NAME;


-- ---- V_DASHBOARD_SUMMARY -------------------------------------------------
-- Single row matching (and extending) exactly what your dashboard
-- cards show today: Publications, Projects, Researchers, Documents —
-- plus pending reviews and total funding for later use.
CREATE OR REPLACE VIEW V_DASHBOARD_SUMMARY AS
SELECT
    (SELECT COUNT(*) FROM PUBLICATION)                                   AS TOTAL_PUBLICATIONS,
    (SELECT COUNT(*) FROM PROJECT)                                       AS TOTAL_PROJECTS,
    (SELECT COUNT(*) FROM "USER")                                        AS TOTAL_RESEARCHERS,
    (SELECT COUNT(*) FROM "FILE")                                        AS TOTAL_DOCUMENTS,
    (SELECT COUNT(*) FROM REVIEW WHERE STATUS = 'Pending')                AS PENDING_REVIEWS,
    (SELECT NVL(SUM(AMOUNT), 0) FROM GRANT_FUNDING)                       AS TOTAL_FUNDING,
    (SELECT COUNT(*) FROM PUBLICATION WHERE CONFIRMATION_STATUS = 'Published') AS PUBLISHED_COUNT
FROM DUAL;

-- ================================================================
-- Verify afterward:
--   SELECT view_name FROM user_views ORDER BY view_name;
--
-- Try each one (all safe, all read-only):
--   SELECT * FROM V_DASHBOARD_SUMMARY;
--   SELECT * FROM V_RESEARCHER_STATISTICS ORDER BY PUBLICATION_COUNT DESC;
--   SELECT * FROM V_PROJECT_FUNDING ORDER BY TOTAL_FUNDING DESC;
--
-- V_DASHBOARD_SUMMARY in particular is worth remembering for Block 15 —
-- your dashboard's 4 separate "Synced with Oracle database" counts can
-- become ONE query against this view instead of 4 separate round trips.
-- ================================================================
