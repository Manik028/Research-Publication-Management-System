-- ================================================================
-- RPMS — DEMONSTRATION SCRIPT
--
-- Run AFTER schema.sql, seed.sql, all block files, and seed_data.sql.
-- A clean, reproducible sequence for a live teacher demo. Read each
-- comment aloud, run the statement(s) under it, move to the next.
--
--   sqlplus RPMS_APP/your_password@localhost:1521/ORCLPDB @demo_queries.sql
-- ================================================================

SET SERVEROUTPUT ON;
SET LINESIZE 150;
SET PAGESIZE 50;



SELECT table_name, num_rows FROM user_tables ORDER BY table_name;
DESC PUBLICATION;
DESC REVIEW;


-- ================================================================
--SAMPLE DATA — already loaded via seed_data.sql
-- ================================================================
SELECT COUNT(*) AS PUBLICATIONS FROM PUBLICATION;
SELECT COUNT(*) AS RESEARCHERS FROM "USER";
SELECT COUNT(*) AS PROJECTS FROM PROJECT;




-- ================================================================
-- JOINS — every publication with authors and venue
-- ================================================================
SELECT p.TITLE, u.FULL_NAME AS AUTHOR, ap.AUTHOR_ORDER,
       NVL(v.NAME, 'No venue') AS VENUE
FROM PUBLICATION p
JOIN AUTHOR_PUBLICATION ap ON ap.PUBLICATION_ID = p.PUBLICATION_ID
JOIN "USER" u ON u.USER_ID = ap.USER_ID
LEFT JOIN VENUE v ON v.VENUE_ID = p.VENUE_ID
ORDER BY p.PUBLICATION_ID, ap.AUTHOR_ORDER;


-- ================================================================
-- AGGREGATION — funding raised per funding body
-- ================================================================
SELECT fb.NAME, SUM(gf.AMOUNT) AS TOTAL_GIVEN, COUNT(*) AS GRANT_COUNT
FROM GRANT_FUNDING gf JOIN FUNDING_BODY fb ON fb.BODY_ID = gf.BODY_ID
GROUP BY fb.NAME
ORDER BY TOTAL_GIVEN DESC;


-- ================================================================
-- SUBQUERIES — researchers who have never published (NOT EXISTS)
-- ================================================================
SELECT u.FULL_NAME
FROM "USER" u
WHERE NOT EXISTS (SELECT 1 FROM AUTHOR_PUBLICATION ap WHERE ap.USER_ID = u.USER_ID);


-- ================================================================
-- ANALYTIC FUNCTIONS — publications ranked by views
-- ================================================================
SELECT TITLE, TOTAL_VIEWS, RANK() OVER (ORDER BY TOTAL_VIEWS DESC) AS VIEW_RANK
FROM PUBLICATION;


-- ================================================================
-- VIEW — one query, real dashboard numbers
-- ================================================================
SELECT * FROM V_DASHBOARD_SUMMARY;
SELECT * FROM V_RESEARCHER_STATISTICS ORDER BY PUBLICATION_COUNT DESC;


-- ================================================================
-- STORED PROCEDURE — assign a reviewer (with validation)
-- ================================================================
-- Succeeds (real publication, real reviewer who isn't an author):
EXEC ASSIGN_REVIEWER(4, 41, SYSDATE + 14);

-- Now show it correctly REJECTING a self-review attempt:
-- EXEC ASSIGN_REVIEWER(4, 43, SYSDATE + 14);  -- 43 (farhan) authored publication 4 -> fails with -20003


-- ================================================================
-- STORED FUNCTION — usable directly inside a SELECT
-- ================================================================
SELECT FULL_NAME, GET_PUBLICATION_COUNT(USER_ID) AS PUBS, GET_RESEARCHER_PRODUCTIVITY(USER_ID) AS SCORE
FROM "USER"
ORDER BY SCORE DESC;


-- ================================================================
-- TRIGGER — completing a review auto-creates a notification
-- ================================================================
-- Pick a real Pending REVIEW_ID first:
SELECT REVIEW_ID, PUBLICATION_ID, REVIEWER_ID, STATUS FROM REVIEW WHERE STATUS = 'Pending';



-- ================================================================
--  TRANSACTION — atomic multi-step publication creation
-- ================================================================
EXEC CREATE_PUBLICATION_FULL('Federated Learning for Edge Devices','A study of communication-efficient FL.',NULL,NULL,1,'1,42','2');
SELECT * FROM V_PUBLICATION_DETAILS WHERE TITLE = 'Federated Learning for Edge Devices';


-- ================================================================
-- ROLLBACK — the same procedure failing and undoing everything
-- ================================================================
-- A bad research area ID (999999) makes the WHOLE call fail —
-- including the publication insert that "succeeded" moments earlier:
-- EXEC CREATE_PUBLICATION_FULL('Should Not Exist','Test',NULL,NULL,1,'1','999999');
-- SELECT * FROM PUBLICATION WHERE TITLE = 'Should Not Exist';  -- 0 rows, proving the rollback worked


-- ================================================================
-- AUDIT LOGGING — every change so far, automatically captured
-- ================================================================
SELECT TABLE_NAME, ACTION_TYPE, COUNT(*) FROM AUDIT_LOG GROUP BY TABLE_NAME, ACTION_TYPE ORDER BY TABLE_NAME;
SELECT * FROM AUDIT_LOG ORDER BY AUDIT_ID DESC FETCH FIRST 5 ROWS ONLY;


-- ================================================================
-- COMPLEX REPORT — institution productivity, one query
-- ================================================================
SELECT i.NAME AS INSTITUTION, COUNT(DISTINCT u.USER_ID) AS RESEARCHERS,
       COUNT(DISTINCT ap.PUBLICATION_ID) AS PUBLICATIONS,
       ROUND(COUNT(DISTINCT ap.PUBLICATION_ID) / NULLIF(COUNT(DISTINCT u.USER_ID), 0), 2) AS PUBS_PER_RESEARCHER
FROM INSTITUTION i
LEFT JOIN "USER" u ON u.INSTITUTION_ID = i.INSTITUTION_ID
LEFT JOIN AUTHOR_PUBLICATION ap ON ap.USER_ID = u.USER_ID
GROUP BY i.NAME
ORDER BY PUBLICATIONS DESC;

