

SET SERVEROUTPUT ON;

DECLARE
    -- Real user IDs, confirmed live
    v_manik  CONSTANT NUMBER := 1;   -- Researcher
    v_admin  CONSTANT NUMBER := 21;  -- Admin
    v_mukta  CONSTANT NUMBER := 41;  -- Researcher
    v_ruhit  CONSTANT NUMBER := 42;  -- Researcher
    v_farhan CONSTANT NUMBER := 43;  -- Researcher
    v_demo   CONSTANT NUMBER := 44;  -- Researcher

    -- Lookup IDs (fetched by name, not assumed)
    v_venue_icse    NUMBER; v_venue_icde NUMBER; v_venue_jss NUMBER; v_venue_tods NUMBER;
    v_area_db       NUMBER; v_area_ml    NUMBER; v_area_se   NUMBER;
    v_inst_du       NUMBER; v_inst_buet  NUMBER;
    v_body_nsf      NUMBER; v_body_ugc   NUMBER;

    -- Generated IDs, captured as created
    v_p1 NUMBER; v_p2 NUMBER; v_p3 NUMBER; v_p4 NUMBER;
    v_p5 NUMBER; v_p6 NUMBER; v_p7 NUMBER; v_p8 NUMBER;
    v_pr1 NUMBER; v_pr2 NUMBER; v_pr3 NUMBER; v_pr4 NUMBER;
    v_rev_p7_manik NUMBER;  -- one review ID we need later for moderation demo
BEGIN
    -- ---- Look up existing lookup-table IDs by name ---------------
    SELECT VENUE_ID INTO v_venue_icse FROM VENUE WHERE NAME LIKE 'International Conference on Software Engineering%';
    SELECT VENUE_ID INTO v_venue_icde FROM VENUE WHERE NAME LIKE '%Data Engineering%';
    SELECT VENUE_ID INTO v_venue_jss  FROM VENUE WHERE NAME = 'Journal of Systems and Software';
    SELECT VENUE_ID INTO v_venue_tods FROM VENUE WHERE NAME LIKE '%Transactions on Database Systems%';

    SELECT AREA_ID INTO v_area_db FROM RESEARCH_AREA WHERE AREA_NAME = 'Database Systems';
    SELECT AREA_ID INTO v_area_ml FROM RESEARCH_AREA WHERE AREA_NAME = 'Machine Learning';
    SELECT AREA_ID INTO v_area_se FROM RESEARCH_AREA WHERE AREA_NAME = 'Software Engineering';

    SELECT INSTITUTION_ID INTO v_inst_du   FROM INSTITUTION WHERE NAME = 'University of Dhaka';
    SELECT INSTITUTION_ID INTO v_inst_buet FROM INSTITUTION WHERE NAME LIKE '%Engineering and Technology%';

    SELECT BODY_ID INTO v_body_nsf FROM FUNDING_BODY WHERE NAME = 'National Science Foundation';
    SELECT BODY_ID INTO v_body_ugc FROM FUNDING_BODY WHERE NAME = 'University Grants Commission';

    -- ---- 1. Link researchers to institutions -----------------------
    UPDATE "USER" SET INSTITUTION_ID = v_inst_buet WHERE USER_ID = v_manik;
    UPDATE "USER" SET INSTITUTION_ID = v_inst_du   WHERE USER_ID = v_mukta;
    UPDATE "USER" SET INSTITUTION_ID = v_inst_buet WHERE USER_ID = v_ruhit;
    UPDATE "USER" SET INSTITUTION_ID = v_inst_du   WHERE USER_ID = v_farhan;
    UPDATE "USER" SET INSTITUTION_ID = v_inst_buet WHERE USER_ID = v_demo;

    -- ---- 2. Researcher specialties (USER_RESEARCH_AREA) ------------
    INSERT INTO USER_RESEARCH_AREA (USER_ID, AREA_ID) VALUES (v_manik, v_area_db);
    INSERT INTO USER_RESEARCH_AREA (USER_ID, AREA_ID) VALUES (v_manik, v_area_ml);
    INSERT INTO USER_RESEARCH_AREA (USER_ID, AREA_ID) VALUES (v_mukta, v_area_ml);
    INSERT INTO USER_RESEARCH_AREA (USER_ID, AREA_ID) VALUES (v_ruhit, v_area_se);
    INSERT INTO USER_RESEARCH_AREA (USER_ID, AREA_ID) VALUES (v_farhan, v_area_db);
    INSERT INTO USER_RESEARCH_AREA (USER_ID, AREA_ID) VALUES (v_demo, v_area_se);
    INSERT INTO USER_RESEARCH_AREA (USER_ID, AREA_ID) VALUES (v_demo, v_area_db);

    -- ---- 3. Publications ---------------------------------------------
    INSERT INTO PUBLICATION (TITLE, ABSTRACT, DOI, SUBMISSION_DATE, TOTAL_VIEWS, TOTAL_DOWNLOADS, CONFIRMATION_STATUS, VENUE_ID, USER_ID)
    VALUES ('Efficient Query Optimization Techniques for Distributed Databases',
            'We present a cost-based optimizer for distributed OLAP workloads.',
            '10.1000/icde.2026.001', DATE '2025-11-02', 1250, 340, 'Published', v_venue_icde, v_manik)
    RETURNING PUBLICATION_ID INTO v_p1;

    INSERT INTO PUBLICATION (TITLE, ABSTRACT, DOI, SUBMISSION_DATE, TOTAL_VIEWS, TOTAL_DOWNLOADS, CONFIRMATION_STATUS, VENUE_ID, USER_ID)
    VALUES ('Deep Learning Approaches for Anomaly Detection in Network Traffic',
            'A comparative study of LSTM and transformer models for intrusion detection.',
            NULL, DATE '2026-06-01', 85, 12, 'Under Review', v_venue_jss, v_mukta)
    RETURNING PUBLICATION_ID INTO v_p2;

    INSERT INTO PUBLICATION (TITLE, ABSTRACT, DOI, SUBMISSION_DATE, TOTAL_VIEWS, TOTAL_DOWNLOADS, CONFIRMATION_STATUS, VENUE_ID, USER_ID)
    VALUES ('A Survey of Microservice Architecture Patterns',
            'We categorize 40 microservice design patterns from industry case studies.',
            '10.1000/icse.2026.014', DATE '2026-01-15', 430, 95, 'Accepted', v_venue_icse, v_ruhit)
    RETURNING PUBLICATION_ID INTO v_p3;

    INSERT INTO PUBLICATION (TITLE, ABSTRACT, DOI, SUBMISSION_DATE, TOTAL_VIEWS, TOTAL_DOWNLOADS, CONFIRMATION_STATUS, VENUE_ID, USER_ID)
    VALUES ('Automated Test Case Generation Using Genetic Algorithms',
            'An evolutionary approach to maximizing branch coverage automatically.',
            NULL, SYSDATE, 0, 0, 'Draft', v_venue_icse, v_farhan)
    RETURNING PUBLICATION_ID INTO v_p4;

    INSERT INTO PUBLICATION (TITLE, ABSTRACT, DOI, SUBMISSION_DATE, TOTAL_VIEWS, TOTAL_DOWNLOADS, CONFIRMATION_STATUS, VENUE_ID, USER_ID)
    VALUES ('Scalable Indexing Structures for Time-Series Data',
            'A B+tree variant tuned for high-cardinality time-series ingestion.',
            '10.1000/tods.2025.088', DATE '2025-08-20', 2100, 560, 'Published', v_venue_tods, v_demo)
    RETURNING PUBLICATION_ID INTO v_p5;

    INSERT INTO PUBLICATION (TITLE, ABSTRACT, DOI, SUBMISSION_DATE, TOTAL_VIEWS, TOTAL_DOWNLOADS, CONFIRMATION_STATUS, VENUE_ID, USER_ID)
    VALUES ('Transformer-Based Models for Code Summarization',
            'Fine-tuning a pretrained transformer to generate function-level docstrings.',
            NULL, SYSDATE - 3, 15, 2, 'Submitted', v_venue_icde, v_manik)
    RETURNING PUBLICATION_ID INTO v_p6;

    INSERT INTO PUBLICATION (TITLE, ABSTRACT, DOI, SUBMISSION_DATE, TOTAL_VIEWS, TOTAL_DOWNLOADS, CONFIRMATION_STATUS, VENUE_ID, USER_ID)
    VALUES ('Blockchain-Based Approaches to Data Provenance',
            'We evaluate blockchain overhead against traditional audit logging.',
            NULL, DATE '2025-09-10', 60, 8, 'Rejected', v_venue_jss, v_mukta)
    RETURNING PUBLICATION_ID INTO v_p7;

    INSERT INTO PUBLICATION (TITLE, ABSTRACT, DOI, SUBMISSION_DATE, TOTAL_VIEWS, TOTAL_DOWNLOADS, CONFIRMATION_STATUS, VENUE_ID, USER_ID)
    VALUES ('Optimizing Cache Replacement Policies for Cloud Storage',
            'A reinforcement-learning-driven cache eviction strategy.',
            NULL, SYSDATE - 10, 40, 5, 'Resubmitted', v_venue_tods, v_ruhit)
    RETURNING PUBLICATION_ID INTO v_p8;

    -- ---- 4. Authors (AUTHOR_PUBLICATION) ------------------------------
    INSERT INTO AUTHOR_PUBLICATION (USER_ID, PUBLICATION_ID, AUTHOR_ROLE, AUTHOR_ORDER, IS_CORRESPONDING) VALUES (v_manik, v_p1, 'Primary', 1, 1);
    INSERT INTO AUTHOR_PUBLICATION (USER_ID, PUBLICATION_ID, AUTHOR_ROLE, AUTHOR_ORDER, IS_CORRESPONDING) VALUES (v_ruhit, v_p1, 'Co-Author', 2, 0);

    INSERT INTO AUTHOR_PUBLICATION (USER_ID, PUBLICATION_ID, AUTHOR_ROLE, AUTHOR_ORDER, IS_CORRESPONDING) VALUES (v_mukta, v_p2, 'Primary', 1, 1);
    INSERT INTO AUTHOR_PUBLICATION (USER_ID, PUBLICATION_ID, AUTHOR_ROLE, AUTHOR_ORDER, IS_CORRESPONDING) VALUES (v_farhan, v_p2, 'Co-Author', 2, 0);
    INSERT INTO AUTHOR_PUBLICATION (USER_ID, PUBLICATION_ID, AUTHOR_ROLE, AUTHOR_ORDER, IS_CORRESPONDING) VALUES (v_demo, v_p2, 'Co-Author', 3, 0);

    INSERT INTO AUTHOR_PUBLICATION (USER_ID, PUBLICATION_ID, AUTHOR_ROLE, AUTHOR_ORDER, IS_CORRESPONDING) VALUES (v_ruhit, v_p3, 'Primary', 1, 1);
    INSERT INTO AUTHOR_PUBLICATION (USER_ID, PUBLICATION_ID, AUTHOR_ROLE, AUTHOR_ORDER, IS_CORRESPONDING) VALUES (v_manik, v_p3, 'Co-Author', 2, 0);

    INSERT INTO AUTHOR_PUBLICATION (USER_ID, PUBLICATION_ID, AUTHOR_ROLE, AUTHOR_ORDER, IS_CORRESPONDING) VALUES (v_farhan, v_p4, 'Primary', 1, 1);

    INSERT INTO AUTHOR_PUBLICATION (USER_ID, PUBLICATION_ID, AUTHOR_ROLE, AUTHOR_ORDER, IS_CORRESPONDING) VALUES (v_demo, v_p5, 'Primary', 1, 1);
    INSERT INTO AUTHOR_PUBLICATION (USER_ID, PUBLICATION_ID, AUTHOR_ROLE, AUTHOR_ORDER, IS_CORRESPONDING) VALUES (v_mukta, v_p5, 'Co-Author', 2, 0);

    INSERT INTO AUTHOR_PUBLICATION (USER_ID, PUBLICATION_ID, AUTHOR_ROLE, AUTHOR_ORDER, IS_CORRESPONDING) VALUES (v_manik, v_p6, 'Primary', 1, 1);
    INSERT INTO AUTHOR_PUBLICATION (USER_ID, PUBLICATION_ID, AUTHOR_ROLE, AUTHOR_ORDER, IS_CORRESPONDING) VALUES (v_farhan, v_p6, 'Co-Author', 2, 0);
    INSERT INTO AUTHOR_PUBLICATION (USER_ID, PUBLICATION_ID, AUTHOR_ROLE, AUTHOR_ORDER, IS_CORRESPONDING) VALUES (v_ruhit, v_p6, 'Co-Author', 3, 0);

    INSERT INTO AUTHOR_PUBLICATION (USER_ID, PUBLICATION_ID, AUTHOR_ROLE, AUTHOR_ORDER, IS_CORRESPONDING) VALUES (v_mukta, v_p7, 'Primary', 1, 1);

    INSERT INTO AUTHOR_PUBLICATION (USER_ID, PUBLICATION_ID, AUTHOR_ROLE, AUTHOR_ORDER, IS_CORRESPONDING) VALUES (v_ruhit, v_p8, 'Primary', 1, 1);
    INSERT INTO AUTHOR_PUBLICATION (USER_ID, PUBLICATION_ID, AUTHOR_ROLE, AUTHOR_ORDER, IS_CORRESPONDING) VALUES (v_demo, v_p8, 'Co-Author', 2, 0);

    -- ---- 5. Research areas per publication -----------------------------
    INSERT INTO PUBLICATION_RESEARCH_AREA (PUBLICATION_ID, AREA_ID) VALUES (v_p1, v_area_db);
    INSERT INTO PUBLICATION_RESEARCH_AREA (PUBLICATION_ID, AREA_ID) VALUES (v_p2, v_area_ml);
    INSERT INTO PUBLICATION_RESEARCH_AREA (PUBLICATION_ID, AREA_ID) VALUES (v_p3, v_area_se);
    INSERT INTO PUBLICATION_RESEARCH_AREA (PUBLICATION_ID, AREA_ID) VALUES (v_p4, v_area_se);
    INSERT INTO PUBLICATION_RESEARCH_AREA (PUBLICATION_ID, AREA_ID) VALUES (v_p5, v_area_db);
    INSERT INTO PUBLICATION_RESEARCH_AREA (PUBLICATION_ID, AREA_ID) VALUES (v_p6, v_area_ml);
    INSERT INTO PUBLICATION_RESEARCH_AREA (PUBLICATION_ID, AREA_ID) VALUES (v_p6, v_area_se);
    INSERT INTO PUBLICATION_RESEARCH_AREA (PUBLICATION_ID, AREA_ID) VALUES (v_p7, v_area_db);
    INSERT INTO PUBLICATION_RESEARCH_AREA (PUBLICATION_ID, AREA_ID) VALUES (v_p8, v_area_db);

    -- ---- 6. Files ----------------------------------------------------
    INSERT INTO "FILE" (FILE_NAME, FILE_TYPE, FILE_SIZE, UPLOAD_DATE, PUBLICATION_ID)
    VALUES ('query_optimizer_paper.pdf', 'PDF', 2450000, DATE '2025-11-02', v_p1);
    INSERT INTO "FILE" (FILE_NAME, FILE_TYPE, FILE_SIZE, UPLOAD_DATE, PUBLICATION_ID)
    VALUES ('microservices_survey.pdf', 'PDF', 1875000, DATE '2026-01-15', v_p3);
    INSERT INTO "FILE" (FILE_NAME, FILE_TYPE, FILE_SIZE, UPLOAD_DATE, PUBLICATION_ID)
    VALUES ('timeseries_indexing.pdf', 'PDF', 3120000, DATE '2025-08-20', v_p5);

    -- ---- 7. Reviews (reviewer is NEVER one of that paper's authors) ----
    -- P1 (authors: Manik, Ruhit) -> reviewed by Mukta, Farhan
    INSERT INTO REVIEW (SCORE, ORIGINALITY, OVERALL_RECOMMENDATION, COMMENTS_AUTHOR, COMMENTS_EDITOR, DEADLINE, STATUS, PUBLICATION_ID, REVIEWER_ID)
    VALUES (8.5, 90, 'Accept', 'Solid experimental results, minor typos in Section 4.', 'Strong accept, ready for camera-ready.', DATE '2025-11-20', 'Completed', v_p1, v_mukta);
    INSERT INTO REVIEW (SCORE, ORIGINALITY, OVERALL_RECOMMENDATION, COMMENTS_AUTHOR, COMMENTS_EDITOR, DEADLINE, STATUS, PUBLICATION_ID, REVIEWER_ID)
    VALUES (7.8, 85, 'Accept', 'Good coverage of related work.', 'Agree with reviewer 1, accept.', DATE '2025-11-20', 'Completed', v_p1, v_farhan);

    -- P2 (authors: Mukta, Farhan, Demo) -> reviewed by Manik (done), Ruhit (pending)
    INSERT INTO REVIEW (SCORE, ORIGINALITY, OVERALL_RECOMMENDATION, COMMENTS_AUTHOR, COMMENTS_EDITOR, DEADLINE, STATUS, PUBLICATION_ID, REVIEWER_ID)
    VALUES (6.5, 70, 'Minor Revision', 'Please clarify the dataset split methodology.', 'Reasonable work, needs minor fixes.', DATE '2026-06-15', 'Completed', v_p2, v_manik);
    INSERT INTO REVIEW (SCORE, ORIGINALITY, OVERALL_RECOMMENDATION, COMMENTS_AUTHOR, COMMENTS_EDITOR, DEADLINE, STATUS, PUBLICATION_ID, REVIEWER_ID)
    VALUES (NULL, NULL, NULL, NULL, NULL, SYSDATE + 10, 'Pending', v_p2, v_ruhit);

    -- P3 (authors: Ruhit, Manik) -> reviewed by Mukta, Demo, Farhan (3, at the cap)
    INSERT INTO REVIEW (SCORE, ORIGINALITY, OVERALL_RECOMMENDATION, COMMENTS_AUTHOR, COMMENTS_EDITOR, DEADLINE, STATUS, PUBLICATION_ID, REVIEWER_ID)
    VALUES (9.0, 95, 'Accept', 'Excellent, comprehensive survey.', 'One of the best surveys this cycle.', DATE '2026-01-25', 'Completed', v_p3, v_mukta);
    INSERT INTO REVIEW (SCORE, ORIGINALITY, OVERALL_RECOMMENDATION, COMMENTS_AUTHOR, COMMENTS_EDITOR, DEADLINE, STATUS, PUBLICATION_ID, REVIEWER_ID)
    VALUES (8.2, 88, 'Accept', 'Well organized taxonomy.', 'Accept.', DATE '2026-01-25', 'Completed', v_p3, v_demo);
    INSERT INTO REVIEW (SCORE, ORIGINALITY, OVERALL_RECOMMENDATION, COMMENTS_AUTHOR, COMMENTS_EDITOR, DEADLINE, STATUS, PUBLICATION_ID, REVIEWER_ID)
    VALUES (8.7, 91, 'Accept', 'Very thorough, minor formatting issues.', 'Accept.', DATE '2026-01-25', 'Completed', v_p3, v_farhan);

    -- P5 (authors: Demo, Mukta) -> reviewed by Manik, Ruhit
    INSERT INTO REVIEW (SCORE, ORIGINALITY, OVERALL_RECOMMENDATION, COMMENTS_AUTHOR, COMMENTS_EDITOR, DEADLINE, STATUS, PUBLICATION_ID, REVIEWER_ID)
    VALUES (9.2, 93, 'Accept', 'Strong empirical evaluation.', 'Accept, excellent work.', DATE '2025-09-01', 'Completed', v_p5, v_manik);
    INSERT INTO REVIEW (SCORE, ORIGINALITY, OVERALL_RECOMMENDATION, COMMENTS_AUTHOR, COMMENTS_EDITOR, DEADLINE, STATUS, PUBLICATION_ID, REVIEWER_ID)
    VALUES (8.9, 89, 'Accept', 'Novel indexing approach.', 'Accept.', DATE '2025-09-01', 'Completed', v_p5, v_ruhit);

    -- P7 (author: Mukta, rejected) -> reviewed by Manik, Ruhit, both low scores
    INSERT INTO REVIEW (SCORE, ORIGINALITY, OVERALL_RECOMMENDATION, COMMENTS_AUTHOR, COMMENTS_EDITOR, DEADLINE, STATUS, PUBLICATION_ID, REVIEWER_ID)
    VALUES (3.5, 40, 'Reject', 'Evaluation lacks statistical rigor.', 'Reject, insufficient evidence.', DATE '2025-09-25', 'Completed', v_p7, v_manik)
    RETURNING REVIEW_ID INTO v_rev_p7_manik;
    INSERT INTO REVIEW (SCORE, ORIGINALITY, OVERALL_RECOMMENDATION, COMMENTS_AUTHOR, COMMENTS_EDITOR, DEADLINE, STATUS, PUBLICATION_ID, REVIEWER_ID)
    VALUES (4.0, 45, 'Reject', 'Overhead claims not well supported.', 'Reject.', DATE '2025-09-25', 'Completed', v_p7, v_ruhit);

    -- P8 (authors: Ruhit, Demo) -> reviewed by Farhan, still pending
    INSERT INTO REVIEW (SCORE, ORIGINALITY, OVERALL_RECOMMENDATION, COMMENTS_AUTHOR, COMMENTS_EDITOR, DEADLINE, STATUS, PUBLICATION_ID, REVIEWER_ID)
    VALUES (NULL, NULL, NULL, NULL, NULL, SYSDATE + 5, 'Pending', v_p8, v_farhan);

    -- ---- 8. Projects (manager = a researcher; no Manager-role account exists yet) ----
    INSERT INTO PROJECT (TITLE, STATUS, TIMELINE, BUDGET, MANAGER_ID)
    VALUES ('AI-Driven Database Query Optimizer', 'Active', 'Jan 2026 - Dec 2026', 500000, v_manik)
    RETURNING PROJECT_ID INTO v_pr1;

    INSERT INTO PROJECT (TITLE, STATUS, TIMELINE, BUDGET, MANAGER_ID)
    VALUES ('Cloud-Native Microservices Framework', 'Completed', 'Mar 2024 - Feb 2025', 300000, v_ruhit)
    RETURNING PROJECT_ID INTO v_pr2;

    INSERT INTO PROJECT (TITLE, STATUS, TIMELINE, BUDGET, MANAGER_ID)
    VALUES ('Secure Distributed Ledger for Academic Records', 'Planned', 'Jul 2026 - Jun 2027', 150000, v_farhan)
    RETURNING PROJECT_ID INTO v_pr3;

    INSERT INTO PROJECT (TITLE, STATUS, TIMELINE, BUDGET, MANAGER_ID)
    VALUES ('Scalable Time-Series Analytics Platform', 'On Hold', 'Sep 2025 - ongoing', 220000, v_demo)
    RETURNING PROJECT_ID INTO v_pr4;

    -- ---- 9. Project membership ------------------------------------------
    INSERT INTO PROJECT_MEMBER (PROJECT_ID, USER_ID, MEMBER_ROLE) VALUES (v_pr1, v_manik, 'Lead');
    INSERT INTO PROJECT_MEMBER (PROJECT_ID, USER_ID, MEMBER_ROLE) VALUES (v_pr1, v_mukta, 'Researcher');
    INSERT INTO PROJECT_MEMBER (PROJECT_ID, USER_ID, MEMBER_ROLE) VALUES (v_pr1, v_ruhit, 'Collaborator');

    INSERT INTO PROJECT_MEMBER (PROJECT_ID, USER_ID, MEMBER_ROLE) VALUES (v_pr2, v_ruhit, 'Lead');
    INSERT INTO PROJECT_MEMBER (PROJECT_ID, USER_ID, MEMBER_ROLE) VALUES (v_pr2, v_demo, 'Researcher');

    INSERT INTO PROJECT_MEMBER (PROJECT_ID, USER_ID, MEMBER_ROLE) VALUES (v_pr3, v_farhan, 'Lead');
    INSERT INTO PROJECT_MEMBER (PROJECT_ID, USER_ID, MEMBER_ROLE) VALUES (v_pr3, v_manik, 'Advisor');

    INSERT INTO PROJECT_MEMBER (PROJECT_ID, USER_ID, MEMBER_ROLE) VALUES (v_pr4, v_demo, 'Lead');
    INSERT INTO PROJECT_MEMBER (PROJECT_ID, USER_ID, MEMBER_ROLE) VALUES (v_pr4, v_mukta, 'Researcher');
    INSERT INTO PROJECT_MEMBER (PROJECT_ID, USER_ID, MEMBER_ROLE) VALUES (v_pr4, v_farhan, 'Collaborator');

    -- ---- 10. Project research areas --------------------------------------
    INSERT INTO PROJECT_RESEARCH_AREA (PROJECT_ID, AREA_ID) VALUES (v_pr1, v_area_db);
    INSERT INTO PROJECT_RESEARCH_AREA (PROJECT_ID, AREA_ID) VALUES (v_pr1, v_area_ml);
    INSERT INTO PROJECT_RESEARCH_AREA (PROJECT_ID, AREA_ID) VALUES (v_pr2, v_area_se);
    INSERT INTO PROJECT_RESEARCH_AREA (PROJECT_ID, AREA_ID) VALUES (v_pr3, v_area_db);
    INSERT INTO PROJECT_RESEARCH_AREA (PROJECT_ID, AREA_ID) VALUES (v_pr4, v_area_db);

    -- ---- 11. Grants (spread across dates for trend queries) ---------------
    INSERT INTO GRANT_FUNDING (AMOUNT, PROJECT_ID, BODY_ID, GRANT_DATE) VALUES (200000, v_pr1, v_body_nsf, DATE '2025-03-15');
    INSERT INTO GRANT_FUNDING (AMOUNT, PROJECT_ID, BODY_ID, GRANT_DATE) VALUES (150000, v_pr1, v_body_ugc, DATE '2025-09-10');
    INSERT INTO GRANT_FUNDING (AMOUNT, PROJECT_ID, BODY_ID, GRANT_DATE) VALUES (100000, v_pr1, v_body_nsf, DATE '2026-02-01');
    INSERT INTO GRANT_FUNDING (AMOUNT, PROJECT_ID, BODY_ID, GRANT_DATE) VALUES (180000, v_pr2, v_body_ugc, DATE '2024-11-05');
    INSERT INTO GRANT_FUNDING (AMOUNT, PROJECT_ID, BODY_ID, GRANT_DATE) VALUES (80000,  v_pr3, v_body_nsf, DATE '2026-01-20');
    INSERT INTO GRANT_FUNDING (AMOUNT, PROJECT_ID, BODY_ID, GRANT_DATE) VALUES (120000, v_pr4, v_body_ugc, DATE '2025-06-30');
    INSERT INTO GRANT_FUNDING (AMOUNT, PROJECT_ID, BODY_ID, GRANT_DATE) VALUES (50000,  v_pr4, v_body_nsf, DATE '2026-03-05');

    -- ---- 12. Awards --------------------------------------------------
    INSERT INTO AWARD (AWARD_NAME, CATEGORY, AWARDING_ORGANIZATION, USER_ID, AWARD_DATE)
    VALUES ('Best Paper Award', 'Research Excellence', 'ICDE 2026', v_manik, DATE '2026-04-15');
    INSERT INTO AWARD (AWARD_NAME, CATEGORY, AWARDING_ORGANIZATION, USER_ID, AWARD_DATE)
    VALUES ('Outstanding Reviewer Award', 'Service', 'ICSE', v_ruhit, DATE '2025-12-01');
    INSERT INTO AWARD (AWARD_NAME, CATEGORY, AWARDING_ORGANIZATION, USER_ID, AWARD_DATE)
    VALUES ('Young Researcher Award', 'Research Excellence', 'University Grants Commission', v_demo, DATE '2025-08-20');
    INSERT INTO AWARD (AWARD_NAME, CATEGORY, AWARDING_ORGANIZATION, USER_ID, AWARD_DATE)
    VALUES ('Best Poster Award', 'Research Excellence', 'ICDE 2025', v_mukta, DATE '2025-05-10');

    -- ---- 13. A few manual notifications (on top of trigger-generated ones) ----
    INSERT INTO NOTIFICATION (CATEGORY, MESSAGE, IS_READ, USER_ID)
    VALUES ('Funding', 'Your project "AI-Driven Database Query Optimizer" received a new grant of $100,000 from National Science Foundation.', 0, v_manik);
    INSERT INTO NOTIFICATION (CATEGORY, MESSAGE, IS_READ, USER_ID)
    VALUES ('Project', 'You have been added as project lead for "Cloud-Native Microservices Framework".', 1, v_ruhit);
    INSERT INTO NOTIFICATION (CATEGORY, MESSAGE, IS_READ, USER_ID)
    VALUES ('Deadline', 'Submission deadline for ICSE 2027 is approaching.', 0, v_farhan);

    -- ---- 14. Moderation queue (references real IDs generated above) ----
    INSERT INTO MODERATION_QUEUE (ITEM_TYPE, REFERENCE_ID, FLAG_REASON, STATUS)
    VALUES ('PUBLICATION', v_p7, 'Reported as a possible duplicate of a prior submission.', 'Pending');
    INSERT INTO MODERATION_QUEUE (ITEM_TYPE, REFERENCE_ID, FLAG_REASON, STATUS, ACTION_TAKEN)
    VALUES ('REVIEW', v_rev_p7_manik, 'Comment language flagged by another editor as overly harsh.', 'Resolved', 'Comment softened by admin after discussion.');

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Seed data loaded: 8 publications, 4 projects, 12 reviews, 7 grants, 4 awards.');
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20099, 'Seed data failed and was fully rolled back: ' || SQLERRM);
END;
/

-- ================================================================
-- Verify afterward — these should now return REAL, interesting rows:
--   SELECT * FROM V_DASHBOARD_SUMMARY;
--   SELECT * FROM V_RESEARCHER_STATISTICS ORDER BY PUBLICATION_COUNT DESC;
--   SELECT * FROM V_PROJECT_FUNDING ORDER BY TOTAL_FUNDING DESC;
--   SELECT GET_RESEARCHER_PRODUCTIVITY(1) FROM DUAL;   -- Manik's score
--
-- Re-run advanced_queries.sql in full — every query should now show
-- real data instead of empty result sets.
--
-- Confirm the audit triggers caught all this activity automatically:
--   SELECT TABLE_NAME, COUNT(*) FROM AUDIT_LOG GROUP BY TABLE_NAME;
-- ================================================================
