
-- SECTION 1: JOINS

SELECT p.TITLE, u.FULL_NAME AS AUTHOR, ap.AUTHOR_ORDER, ap.AUTHOR_ROLE,
       NVL(v.NAME, 'No venue yet') AS VENUE
FROM PUBLICATION p
JOIN AUTHOR_PUBLICATION ap ON ap.PUBLICATION_ID = p.PUBLICATION_ID
JOIN "USER" u              ON u.USER_ID = ap.USER_ID
LEFT JOIN VENUE v          ON v.VENUE_ID = p.VENUE_ID
ORDER BY p.PUBLICATION_ID, ap.AUTHOR_ORDER;


SELECT u.FULL_NAME, COUNT(ap.PUBLICATION_ID) AS PUB_COUNT
FROM "USER" u
LEFT JOIN AUTHOR_PUBLICATION ap ON ap.USER_ID = u.USER_ID
GROUP BY u.FULL_NAME
ORDER BY PUB_COUNT DESC;


SELECT u1.FULL_NAME AS AUTHOR_A, u2.FULL_NAME AS AUTHOR_B, COUNT(*) AS PAPERS_TOGETHER
FROM AUTHOR_PUBLICATION ap1
JOIN AUTHOR_PUBLICATION ap2 ON ap1.PUBLICATION_ID = ap2.PUBLICATION_ID
                            AND ap1.USER_ID < ap2.USER_ID
JOIN "USER" u1 ON u1.USER_ID = ap1.USER_ID
JOIN "USER" u2 ON u2.USER_ID = ap2.USER_ID
GROUP BY u1.FULL_NAME, u2.FULL_NAME
ORDER BY PAPERS_TOGETHER DESC;


SELECT u.FULL_NAME, pm.PROJECT_ID, pm.MEMBER_ROLE
FROM "USER" u
FULL OUTER JOIN PROJECT_MEMBER pm ON pm.USER_ID = u.USER_ID;


SELECT p.TITLE, u.FULL_NAME AS MANAGER,
       COUNT(DISTINCT pm.USER_ID) AS MEMBER_COUNT,
       NVL(SUM(gf.AMOUNT), 0)     AS TOTAL_FUNDING
FROM PROJECT p
JOIN "USER" u              ON u.USER_ID = p.MANAGER_ID
LEFT JOIN PROJECT_MEMBER pm ON pm.PROJECT_ID = p.PROJECT_ID
LEFT JOIN GRANT_FUNDING gf  ON gf.PROJECT_ID = p.PROJECT_ID
GROUP BY p.TITLE, u.FULL_NAME
ORDER BY TOTAL_FUNDING DESC;


SELECT ra.AREA_NAME, COUNT(*) AS PUB_COUNT
FROM PUBLICATION_RESEARCH_AREA pra
JOIN RESEARCH_AREA ra ON ra.AREA_ID = pra.AREA_ID
GROUP BY ra.AREA_NAME
HAVING COUNT(*) > 1
ORDER BY PUB_COUNT DESC;

--AVG/MIN/MAX — review score spread per publication.
SELECT p.TITLE,
       ROUND(AVG(r.SCORE), 2) AS AVG_SCORE,
       MIN(r.SCORE)           AS MIN_SCORE,
       MAX(r.SCORE)           AS MAX_SCORE,
       COUNT(r.REVIEW_ID)     AS REVIEW_COUNT
FROM PUBLICATION p
JOIN REVIEW r ON r.PUBLICATION_ID = p.PUBLICATION_ID
WHERE r.SCORE IS NOT NULL
GROUP BY p.TITLE
ORDER BY AVG_SCORE DESC;

--SUM — total funding contributed by each funding body.
SELECT fb.NAME, SUM(gf.AMOUNT) AS TOTAL_GIVEN, COUNT(gf.GRANT_ID) AS GRANT_COUNT
FROM GRANT_FUNDING gf
JOIN FUNDING_BODY fb ON fb.BODY_ID = gf.BODY_ID
GROUP BY fb.NAME
ORDER BY TOTAL_GIVEN DESC;


-- ================================================================
-- SECTION 3: SUBQUERIES
-- ================================================================

--Scalar subquery — publications with above-average view counts.
SELECT TITLE, TOTAL_VIEWS
FROM PUBLICATION
WHERE TOTAL_VIEWS > (SELECT AVG(TOTAL_VIEWS) FROM PUBLICATION)
ORDER BY TOTAL_VIEWS DESC;

--NOT EXISTS (correlated) — researchers who have never published.
SELECT u.FULL_NAME
FROM "USER" u
WHERE NOT EXISTS (
    SELECT 1 FROM AUTHOR_PUBLICATION ap WHERE ap.USER_ID = u.USER_ID
);

-- EXISTS (correlated) — publications that have at least one
-- COMPLETED review (as opposed to just any review row existing).
SELECT p.TITLE
FROM PUBLICATION p
WHERE EXISTS (
    SELECT 1 FROM REVIEW r
    WHERE r.PUBLICATION_ID = p.PUBLICATION_ID AND r.STATUS = 'Completed'
);

-- IN (nested) — projects funded by a Government-type funding body.
SELECT DISTINCT p.TITLE
FROM PROJECT p
JOIN GRANT_FUNDING gf ON gf.PROJECT_ID = p.PROJECT_ID
WHERE gf.BODY_ID IN (
    SELECT BODY_ID FROM FUNDING_BODY WHERE ORGANIZATION_TYPE = 'Government'
);

-- NOT IN — researchers who aren't on ANY project team.
SELECT FULL_NAME
FROM "USER"
WHERE USER_ID NOT IN (SELECT USER_ID FROM PROJECT_MEMBER);

--ALL — publications where EVERY review score is at least 7
SELECT p.TITLE
FROM PUBLICATION p
WHERE 7 <= ALL (
    SELECT r.SCORE FROM REVIEW r
    WHERE r.PUBLICATION_ID = p.PUBLICATION_ID AND r.SCORE IS NOT NULL
)
AND EXISTS (SELECT 1 FROM REVIEW r2 WHERE r2.PUBLICATION_ID = p.PUBLICATION_ID);


-- ================================================================
-- SECTION 4: SET OPERATIONS
-- ================================================================

-- UNION — everyone connected to a project, either as manager OR
-- as a team member (duplicates removed automatically by UNION).
SELECT MANAGER_ID AS USER_ID, 'Manager' AS VIA FROM PROJECT
UNION
SELECT USER_ID, 'Member' FROM PROJECT_MEMBER;

--INTERSECT — researchers who are BOTH authors and reviewers.
SELECT USER_ID FROM AUTHOR_PUBLICATION
INTERSECT
SELECT REVIEWER_ID FROM REVIEW;

-- MINUS — researchers who have authored papers but have NEVER
-- reviewed anything.
SELECT USER_ID FROM AUTHOR_PUBLICATION
MINUS
SELECT REVIEWER_ID FROM REVIEW;


-- ================================================================
-- SECTION 5: CONDITIONAL LOGIC
-- ================================================================

-- CASE — bucket publications into engagement tiers.
SELECT TITLE, TOTAL_VIEWS,
       CASE
           WHEN TOTAL_VIEWS >= 1000 THEN 'High'
           WHEN TOTAL_VIEWS >= 100  THEN 'Medium'
           ELSE 'Low'
       END AS ENGAGEMENT_TIER
FROM PUBLICATION
ORDER BY TOTAL_VIEWS DESC;

-- NVL — show a friendly placeholder instead of NULL for
-- publications with no venue assigned yet.
SELECT p.TITLE, NVL(v.NAME, 'Not yet assigned') AS VENUE
FROM PUBLICATION p
LEFT JOIN VENUE v ON v.VENUE_ID = p.VENUE_ID;


-- ================================================================
-- SECTION 6: CTE (WITH clause)
-- ================================================================

-- CTE — compute per-project funding once, then filter/sort the
-- pre-computed result (cleaner than repeating the SUM subquery).
WITH PROJECT_FUNDING AS (
    SELECT p.PROJECT_ID, p.TITLE, NVL(SUM(gf.AMOUNT), 0) AS TOTAL_FUNDING
    FROM PROJECT p
    LEFT JOIN GRANT_FUNDING gf ON gf.PROJECT_ID = p.PROJECT_ID
    GROUP BY p.PROJECT_ID, p.TITLE
)
SELECT * FROM PROJECT_FUNDING
WHERE TOTAL_FUNDING > 0
ORDER BY TOTAL_FUNDING DESC;


-- ================================================================
-- SECTION 7: ANALYTIC (WINDOW) FUNCTIONS
-- ================================================================

-- ROW_NUMBER + PARTITION BY — the single most-published researcher
-- IN EACH DEPARTMENT (not overall — one winner per department).
SELECT DEPARTMENT, FULL_NAME, PUB_COUNT FROM (
    SELECT u.DEPARTMENT, u.FULL_NAME, COUNT(ap.PUBLICATION_ID) AS PUB_COUNT,
           ROW_NUMBER() OVER (
               PARTITION BY u.DEPARTMENT
               ORDER BY COUNT(ap.PUBLICATION_ID) DESC
           ) AS RN
    FROM "USER" u
    LEFT JOIN AUTHOR_PUBLICATION ap ON ap.USER_ID = u.USER_ID
    GROUP BY u.DEPARTMENT, u.FULL_NAME
)
WHERE RN = 1;

--RANK — rank every publication by view count (RANK, not
-- DENSE_RANK, so ties correctly skip the next rank number).
SELECT TITLE, TOTAL_VIEWS,
       RANK() OVER (ORDER BY TOTAL_VIEWS DESC) AS VIEW_RANK
FROM PUBLICATION;

--LAG — for each funding body, show each grant next to the
-- PREVIOUS grant amount they gave (chronologically), to spot jumps.
SELECT fb.NAME, gf.GRANT_DATE, gf.AMOUNT,
       LAG(gf.AMOUNT) OVER (
           PARTITION BY fb.BODY_ID ORDER BY gf.GRANT_DATE
       ) AS PREVIOUS_GRANT_AMOUNT
FROM GRANT_FUNDING gf
JOIN FUNDING_BODY fb ON fb.BODY_ID = gf.BODY_ID
ORDER BY fb.NAME, gf.GRANT_DATE;

-- SUM() OVER — running (cumulative) total funding received per
-- project over time, without collapsing rows the way GROUP BY would.
SELECT PROJECT_ID, GRANT_DATE, AMOUNT,
       SUM(AMOUNT) OVER (
           PARTITION BY PROJECT_ID ORDER BY GRANT_DATE
       ) AS RUNNING_TOTAL
FROM GRANT_FUNDING
ORDER BY PROJECT_ID, GRANT_DATE;


