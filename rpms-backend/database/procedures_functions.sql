
CREATE OR REPLACE PROCEDURE ASSIGN_REVIEWER (
    p_publication_id IN REVIEW.PUBLICATION_ID%TYPE,
    p_reviewer_id    IN REVIEW.REVIEWER_ID%TYPE,
    p_deadline       IN REVIEW.DEADLINE%TYPE
) AS
    v_dummy       NUMBER;
    v_author_count NUMBER;
BEGIN
    BEGIN
        SELECT 1 INTO v_dummy FROM PUBLICATION WHERE PUBLICATION_ID = p_publication_id;
    EXCEPTION WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20001, 'Publication ' || p_publication_id || ' does not exist.');
    END;

    BEGIN
        SELECT 1 INTO v_dummy FROM "USER" WHERE USER_ID = p_reviewer_id;
    EXCEPTION WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20002, 'Reviewer ' || p_reviewer_id || ' does not exist.');
    END;

    SELECT COUNT(*) INTO v_author_count
    FROM AUTHOR_PUBLICATION
    WHERE PUBLICATION_ID = p_publication_id AND USER_ID = p_reviewer_id;

    IF v_author_count > 0 THEN
        RAISE_APPLICATION_ERROR(-20003, 'A reviewer cannot be assigned to review their own publication.');
    END IF;

    IF p_deadline <= SYSDATE THEN
        RAISE_APPLICATION_ERROR(-20004, 'Review deadline must be a future date.');
    END IF;

    BEGIN
        INSERT INTO REVIEW (PUBLICATION_ID, REVIEWER_ID, DEADLINE, STATUS)
        VALUES (p_publication_id, p_reviewer_id, p_deadline, 'Pending');
    EXCEPTION WHEN DUP_VAL_ON_INDEX THEN
        RAISE_APPLICATION_ERROR(-20005, 'This reviewer is already assigned to this publication.');
    END;

    COMMIT;
END ASSIGN_REVIEWER;
/
SHOW ERRORS


-- ---- SUBMIT_REVIEW -------------------------------------------------------
-- Only the reviewer who owns the assignment can submit it, and only
-- while it's still Pending (no resubmitting a Completed review).
-- Score/originality range checks are NOT duplicated here — the table's
-- own CHECK constraints (schema.sql) already enforce 1-10 and 0-100
-- and will raise ORA-02290 automatically if violated.
CREATE OR REPLACE PROCEDURE SUBMIT_REVIEW (
    p_review_id        IN REVIEW.REVIEW_ID%TYPE,
    p_reviewer_id       IN REVIEW.REVIEWER_ID%TYPE,
    p_score             IN REVIEW.SCORE%TYPE,
    p_originality        IN REVIEW.ORIGINALITY%TYPE,
    p_recommendation    IN REVIEW.OVERALL_RECOMMENDATION%TYPE,
    p_comments_author   IN REVIEW.COMMENTS_AUTHOR%TYPE,
    p_comments_editor    IN REVIEW.COMMENTS_EDITOR%TYPE
) AS
    v_status VARCHAR2(50);
    v_owner  NUMBER;
BEGIN
    BEGIN
        SELECT STATUS, REVIEWER_ID INTO v_status, v_owner
        FROM REVIEW WHERE REVIEW_ID = p_review_id;
    EXCEPTION WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20010, 'Review ' || p_review_id || ' does not exist.');
    END;

    IF v_owner != p_reviewer_id THEN
        RAISE_APPLICATION_ERROR(-20011, 'This review does not belong to this reviewer.');
    END IF;

    IF v_status != 'Pending' THEN
        RAISE_APPLICATION_ERROR(-20012, 'This review is already "' || v_status || '" and cannot be resubmitted.');
    END IF;

    UPDATE REVIEW
    SET SCORE = p_score,
        ORIGINALITY = p_originality,
        OVERALL_RECOMMENDATION = p_recommendation,
        COMMENTS_AUTHOR = p_comments_author,
        COMMENTS_EDITOR = p_comments_editor,
        STATUS = 'Completed'
    WHERE REVIEW_ID = p_review_id;

    COMMIT;
END SUBMIT_REVIEW;
/
SHOW ERRORS


-- ---- APPROVE_PUBLICATION -------------------------------------------------
-- Only allows the transition from Under Review / Resubmitted -> Accepted.
-- Trying to "approve" a Draft or already-Rejected paper is refused —
-- this is exactly the "sensible transitions only" rule from Block 6.
CREATE OR REPLACE PROCEDURE APPROVE_PUBLICATION (
    p_publication_id IN PUBLICATION.PUBLICATION_ID%TYPE
) AS
    v_status VARCHAR2(50);
BEGIN
    BEGIN
        SELECT CONFIRMATION_STATUS INTO v_status
        FROM PUBLICATION WHERE PUBLICATION_ID = p_publication_id;
    EXCEPTION WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20020, 'Publication ' || p_publication_id || ' does not exist.');
    END;

    IF v_status NOT IN ('Under Review', 'Resubmitted') THEN
        RAISE_APPLICATION_ERROR(-20021,
            'Cannot approve a publication with status "' || v_status || '". ' ||
            'Only "Under Review" or "Resubmitted" publications can be approved.');
    END IF;

    UPDATE PUBLICATION SET CONFIRMATION_STATUS = 'Accepted' WHERE PUBLICATION_ID = p_publication_id;
    COMMIT;
END APPROVE_PUBLICATION;
/
SHOW ERRORS


-- ---- REJECT_PUBLICATION ---------------------------------------------------
CREATE OR REPLACE PROCEDURE REJECT_PUBLICATION (
    p_publication_id IN PUBLICATION.PUBLICATION_ID%TYPE
) AS
    v_status VARCHAR2(50);
BEGIN
    BEGIN
        SELECT CONFIRMATION_STATUS INTO v_status
        FROM PUBLICATION WHERE PUBLICATION_ID = p_publication_id;
    EXCEPTION WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20022, 'Publication ' || p_publication_id || ' does not exist.');
    END;

    IF v_status NOT IN ('Under Review', 'Resubmitted') THEN
        RAISE_APPLICATION_ERROR(-20023,
            'Cannot reject a publication with status "' || v_status || '". ' ||
            'Only "Under Review" or "Resubmitted" publications can be rejected.');
    END IF;

    UPDATE PUBLICATION SET CONFIRMATION_STATUS = 'Rejected' WHERE PUBLICATION_ID = p_publication_id;
    COMMIT;
END REJECT_PUBLICATION;
/
SHOW ERRORS


-- ---- ADD_PROJECT_GRANT ---------------------------------------------------
CREATE OR REPLACE PROCEDURE ADD_PROJECT_GRANT (
    p_project_id IN GRANT_FUNDING.PROJECT_ID%TYPE,
    p_body_id    IN GRANT_FUNDING.BODY_ID%TYPE,
    p_amount     IN GRANT_FUNDING.AMOUNT%TYPE
) AS
    v_dummy NUMBER;
BEGIN
    BEGIN
        SELECT 1 INTO v_dummy FROM PROJECT WHERE PROJECT_ID = p_project_id;
    EXCEPTION WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20030, 'Project ' || p_project_id || ' does not exist.');
    END;

    BEGIN
        SELECT 1 INTO v_dummy FROM FUNDING_BODY WHERE BODY_ID = p_body_id;
    EXCEPTION WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20031, 'Funding body ' || p_body_id || ' does not exist.');
    END;

    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE_APPLICATION_ERROR(-20032, 'Grant amount must be greater than 0.');
    END IF;

    INSERT INTO GRANT_FUNDING (AMOUNT, PROJECT_ID, BODY_ID, GRANT_DATE)
    VALUES (p_amount, p_project_id, p_body_id, SYSDATE);

    COMMIT;
END ADD_PROJECT_GRANT;
/
SHOW ERRORS


-- ---- ADD_PROJECT_MEMBER ---------------------------------------------------
-- Duplicate membership is caught via PROJECT_MEMBER's own composite
-- primary key (Block 5) rather than a redundant manual SELECT check.
CREATE OR REPLACE PROCEDURE ADD_PROJECT_MEMBER (
    p_project_id IN PROJECT_MEMBER.PROJECT_ID%TYPE,
    p_user_id    IN PROJECT_MEMBER.USER_ID%TYPE,
    p_role       IN PROJECT_MEMBER.MEMBER_ROLE%TYPE DEFAULT 'Researcher'
) AS
    v_dummy NUMBER;
BEGIN
    BEGIN
        SELECT 1 INTO v_dummy FROM PROJECT WHERE PROJECT_ID = p_project_id;
    EXCEPTION WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20040, 'Project ' || p_project_id || ' does not exist.');
    END;

    BEGIN
        SELECT 1 INTO v_dummy FROM "USER" WHERE USER_ID = p_user_id;
    EXCEPTION WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20041, 'User ' || p_user_id || ' does not exist.');
    END;

    BEGIN
        INSERT INTO PROJECT_MEMBER (PROJECT_ID, USER_ID, MEMBER_ROLE)
        VALUES (p_project_id, p_user_id, p_role);
    EXCEPTION WHEN DUP_VAL_ON_INDEX THEN
        RAISE_APPLICATION_ERROR(-20042, 'This user is already a member of this project.');
    END;

    COMMIT;
END ADD_PROJECT_MEMBER;
/
SHOW ERRORS


-- ================================================================
-- PART B — FUNCTIONS (usable directly inside SELECT statements)
--
-- NOTE: parameters here use "p_user_id IN NUMBER" rather than
-- anchoring to "USER".USER_ID%TYPE. USER is a reserved PL/SQL
-- pseudo-function (returns the current DB username) as well as your
-- table name, and the compiler rejects the anchor even when quoted
-- (PLS-00225). NUMBER is exactly what USER_ID is anyway (a NUMBER
-- identity column), so this sidesteps the conflict entirely.
-- ================================================================

CREATE OR REPLACE FUNCTION GET_PUBLICATION_COUNT (
    p_user_id IN NUMBER
) RETURN NUMBER AS
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM AUTHOR_PUBLICATION WHERE USER_ID = p_user_id;
    RETURN v_count;
END GET_PUBLICATION_COUNT;
/
SHOW ERRORS


-- Productivity is a simple weighted score for ranking/demo purposes —
-- publications weighted highest (3x), projects (2x), awards (1x).
-- The weights are a documented design choice, not a hidden formula,
-- and can be changed here in one place if you want a different mix.
CREATE OR REPLACE FUNCTION GET_RESEARCHER_PRODUCTIVITY (
    p_user_id IN NUMBER
) RETURN NUMBER AS
    v_pubs     NUMBER;
    v_projects NUMBER;
    v_awards   NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_pubs     FROM AUTHOR_PUBLICATION WHERE USER_ID = p_user_id;
    SELECT COUNT(*) INTO v_projects FROM PROJECT_MEMBER     WHERE USER_ID = p_user_id;
    SELECT COUNT(*) INTO v_awards   FROM AWARD              WHERE USER_ID = p_user_id;
    RETURN (v_pubs * 3) + (v_projects * 2) + (v_awards * 1);
END GET_RESEARCHER_PRODUCTIVITY;
/
SHOW ERRORS


CREATE OR REPLACE FUNCTION GET_PROJECT_TOTAL_FUNDING (
    p_project_id IN PROJECT.PROJECT_ID%TYPE
) RETURN NUMBER AS
    v_total NUMBER;
BEGIN
    SELECT NVL(SUM(AMOUNT), 0) INTO v_total FROM GRANT_FUNDING WHERE PROJECT_ID = p_project_id;
    RETURN v_total;
END GET_PROJECT_TOTAL_FUNDING;
/
SHOW ERRORS


CREATE OR REPLACE FUNCTION GET_AVERAGE_REVIEW_SCORE (
    p_publication_id IN PUBLICATION.PUBLICATION_ID%TYPE
) RETURN NUMBER AS
    v_avg NUMBER;
BEGIN
    SELECT AVG(SCORE) INTO v_avg
    FROM REVIEW WHERE PUBLICATION_ID = p_publication_id AND SCORE IS NOT NULL;
    RETURN v_avg;  -- NULL if no scored reviews yet — correct, not an error
END GET_AVERAGE_REVIEW_SCORE;
/
SHOW ERRORS


CREATE OR REPLACE FUNCTION GET_RESEARCHER_PROJECT_COUNT (
    p_user_id IN NUMBER
) RETURN NUMBER AS
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM PROJECT_MEMBER WHERE USER_ID = p_user_id;
    RETURN v_count;
END GET_RESEARCHER_PROJECT_COUNT;
/
SHOW ERRORS


CREATE OR REPLACE FUNCTION GET_INSTITUTION_PUBLICATION_COUNT (
    p_institution_id IN INSTITUTION.INSTITUTION_ID%TYPE
) RETURN NUMBER AS
    v_count NUMBER;
BEGIN
    SELECT COUNT(DISTINCT ap.PUBLICATION_ID) INTO v_count
    FROM AUTHOR_PUBLICATION ap
    JOIN "USER" u ON u.USER_ID = ap.USER_ID
    WHERE u.INSTITUTION_ID = p_institution_id;
    RETURN v_count;
END GET_INSTITUTION_PUBLICATION_COUNT;
/
SHOW ERRORS


CREATE OR REPLACE FUNCTION GET_RESEARCH_AREA_PUBLICATION_COUNT (
    p_area_id IN RESEARCH_AREA.AREA_ID%TYPE
) RETURN NUMBER AS
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM PUBLICATION_RESEARCH_AREA WHERE AREA_ID = p_area_id;
    RETURN v_count;
END GET_RESEARCH_AREA_PUBLICATION_COUNT;
/
SHOW ERRORS


