
CREATE OR REPLACE PROCEDURE CREATE_PUBLICATION_FULL (
    p_title        IN PUBLICATION.TITLE%TYPE,
    p_abstract     IN PUBLICATION.ABSTRACT%TYPE,
    p_doi          IN PUBLICATION.DOI%TYPE,
    p_venue_id     IN PUBLICATION.VENUE_ID%TYPE,
    p_owner_user_id IN PUBLICATION.USER_ID%TYPE,
    p_author_ids   IN VARCHAR2,   -- e.g. '3,5,9' — first ID = corresponding author
    p_area_ids     IN VARCHAR2 DEFAULT NULL
) AS
    v_pub_id NUMBER;
    v_order  NUMBER := 1;
BEGIN
    INSERT INTO PUBLICATION (TITLE, ABSTRACT, DOI, VENUE_ID, USER_ID)
    VALUES (p_title, p_abstract, p_doi, p_venue_id, p_owner_user_id)
    RETURNING PUBLICATION_ID INTO v_pub_id;

    FOR rec IN (
        SELECT TRIM(REGEXP_SUBSTR(p_author_ids, '[^,]+', 1, LEVEL)) AS aid
        FROM DUAL
        CONNECT BY REGEXP_SUBSTR(p_author_ids, '[^,]+', 1, LEVEL) IS NOT NULL
    ) LOOP
        INSERT INTO AUTHOR_PUBLICATION (USER_ID, PUBLICATION_ID, AUTHOR_ORDER, IS_CORRESPONDING)
        VALUES (TO_NUMBER(rec.aid), v_pub_id, v_order, CASE WHEN v_order = 1 THEN 1 ELSE 0 END);
        v_order := v_order + 1;
    END LOOP;

    IF p_area_ids IS NOT NULL THEN
        FOR rec IN (
            SELECT TRIM(REGEXP_SUBSTR(p_area_ids, '[^,]+', 1, LEVEL)) AS aid
            FROM DUAL
            CONNECT BY REGEXP_SUBSTR(p_area_ids, '[^,]+', 1, LEVEL) IS NOT NULL
        ) LOOP
            INSERT INTO PUBLICATION_RESEARCH_AREA (PUBLICATION_ID, AREA_ID)
            VALUES (v_pub_id, TO_NUMBER(rec.aid));
        END LOOP;
    END IF;

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Created PUBLICATION_ID ' || v_pub_id || ' with authors and research areas.');
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20060,
            'CREATE_PUBLICATION_FULL failed and was fully rolled back (nothing saved): ' || SQLERRM);
END CREATE_PUBLICATION_FULL;
/
SHOW ERRORS


-- ---- ASSIGN_REVIEWER (re-created with locking + a real cap) --------------
--   - A hard cap of 3 reviewers per publication (a real editorial rule).
--   - SELECT ... FOR UPDATE on the publication row BEFORE checking that
--     cap. This forces a second concurrent call for the SAME publication
--     to wait until the first one commits (or rolls back) — closing the
--     race condition described above. Different publications are
--     unaffected and run fully in parallel; only same-row concurrent
--     calls are serialized.
CREATE OR REPLACE PROCEDURE ASSIGN_REVIEWER (
    p_publication_id IN REVIEW.PUBLICATION_ID%TYPE,
    p_reviewer_id    IN REVIEW.REVIEWER_ID%TYPE,
    p_deadline       IN REVIEW.DEADLINE%TYPE
) AS
    v_dummy         NUMBER;
    v_author_count  NUMBER;
    v_review_count  NUMBER;
    c_max_reviewers CONSTANT NUMBER := 3;
BEGIN
    BEGIN
        -- FOR UPDATE locks this PUBLICATION row for the rest of the
        -- transaction. A second session calling this procedure for the
        -- SAME publication blocks here until this transaction commits.
        SELECT 1 INTO v_dummy FROM PUBLICATION
        WHERE PUBLICATION_ID = p_publication_id FOR UPDATE;
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

    -- Safe to check now — the FOR UPDATE lock above guarantees no other
    -- session can be mid-insert for this same publication right now.
    SELECT COUNT(*) INTO v_review_count
    FROM REVIEW WHERE PUBLICATION_ID = p_publication_id;

    IF v_review_count >= c_max_reviewers THEN
        RAISE_APPLICATION_ERROR(-20006,
            'Publication ' || p_publication_id || ' already has the maximum of ' ||
            c_max_reviewers || ' reviewers assigned.');
    END IF;

    BEGIN
        INSERT INTO REVIEW (PUBLICATION_ID, REVIEWER_ID, DEADLINE, STATUS)
        VALUES (p_publication_id, p_reviewer_id, p_deadline, 'Pending');
    EXCEPTION WHEN DUP_VAL_ON_INDEX THEN
        RAISE_APPLICATION_ERROR(-20005, 'This reviewer is already assigned to this publication.');
    END;

    COMMIT;  -- releases the FOR UPDATE lock
END ASSIGN_REVIEWER;
/
SHOW ERRORS

-- ================================================================
-- Verify afterward:
--
-- Test 1 — ATOMICITY (should FAIL and roll back completely). Use a
-- real p_owner_user_id and one real author ID, but a FAKE area ID:
--   EXEC CREATE_PUBLICATION_FULL('Test Paper','Abstract text',NULL,NULL,1,'1','999999');
--   -- Confirm NOTHING was saved, not even the publication row:
--   SELECT * FROM PUBLICATION WHERE TITLE = 'Test Paper';  -- 0 rows
--
-- Test 2 — ATOMICITY (should SUCCEED, all 3 parts together). Use real
-- IDs from your data:
--   EXEC CREATE_PUBLICATION_FULL('Real Paper','Abstract text',NULL,NULL,1,'1,2','1');
--   SELECT * FROM V_PUBLICATION_DETAILS WHERE TITLE = 'Real Paper';
--   -- should show both authors and the research area together
--
-- Test 3 — the reviewer cap (use a real publication with < 3 reviewers):
--   EXEC ASSIGN_REVIEWER(1, 2, SYSDATE + 14);
--   EXEC ASSIGN_REVIEWER(1, 3, SYSDATE + 14);
--   EXEC ASSIGN_REVIEWER(1, 4, SYSDATE + 14);
--   EXEC ASSIGN_REVIEWER(1, 5, SYSDATE + 14);  -- 4th one should FAIL with -20006
--
-- Test 4 — the actual lock (needs TWO sqlplus windows, both logged in
-- as RPMS_APP, to see for real):
--   Window A: EXEC ASSIGN_REVIEWER(2, 6, SYSDATE + 14);  -- don't COMMIT yet;
--             actually to hold the lock open, run the SELECT...FOR UPDATE
--             line by hand instead: SELECT 1 FROM PUBLICATION WHERE
--             PUBLICATION_ID = 2 FOR UPDATE;  (leave this session open)
--   Window B: EXEC ASSIGN_REVIEWER(2, 7, SYSDATE + 14);  -- this will HANG,
--             waiting for Window A
--   Window A: COMMIT;  (or ROLLBACK;)  -- Window B immediately unblocks
--             and completes right after
-- ================================================================
