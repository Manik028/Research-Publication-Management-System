

CREATE TABLE AUDIT_LOG (
    AUDIT_ID         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    TABLE_NAME       VARCHAR2(50) NOT NULL,
    RECORD_ID        NUMBER NOT NULL,
    ACTION_TYPE      VARCHAR2(10) NOT NULL CHECK (ACTION_TYPE IN ('INSERT', 'UPDATE', 'DELETE')),
    OLD_VALUE        CLOB,
    NEW_VALUE        CLOB,
    CHANGED_BY       VARCHAR2(50) DEFAULT USER,
    ACTION_TIMESTAMP TIMESTAMP DEFAULT SYSTIMESTAMP
);

-- The most common audit query is "show me the history of record X in
-- table Y" — this composite index serves exactly that.
CREATE INDEX IDX_AUDIT_TABLE_RECORD ON AUDIT_LOG(TABLE_NAME, RECORD_ID);
CREATE INDEX IDX_AUDIT_TIMESTAMP    ON AUDIT_LOG(ACTION_TIMESTAMP);


-- ---- TRG_PUBLICATION_AUDIT -------------------------------------------
CREATE OR REPLACE TRIGGER TRG_PUBLICATION_AUDIT
AFTER INSERT OR UPDATE OR DELETE ON PUBLICATION
FOR EACH ROW
DECLARE
    v_action    VARCHAR2(10);
    v_record_id NUMBER;
    v_old       CLOB;
    v_new       CLOB;
BEGIN
    IF INSERTING THEN
        v_action := 'INSERT';
        v_record_id := :NEW.PUBLICATION_ID;
        v_new := 'TITLE=' || :NEW.TITLE || '; STATUS=' || :NEW.CONFIRMATION_STATUS || '; VENUE_ID=' || :NEW.VENUE_ID;
    ELSIF UPDATING THEN
        v_action := 'UPDATE';
        v_record_id := :NEW.PUBLICATION_ID;
        v_old := 'TITLE=' || :OLD.TITLE || '; STATUS=' || :OLD.CONFIRMATION_STATUS || '; VENUE_ID=' || :OLD.VENUE_ID;
        v_new := 'TITLE=' || :NEW.TITLE || '; STATUS=' || :NEW.CONFIRMATION_STATUS || '; VENUE_ID=' || :NEW.VENUE_ID;
    ELSIF DELETING THEN
        v_action := 'DELETE';
        v_record_id := :OLD.PUBLICATION_ID;
        v_old := 'TITLE=' || :OLD.TITLE || '; STATUS=' || :OLD.CONFIRMATION_STATUS || '; VENUE_ID=' || :OLD.VENUE_ID;
    END IF;

    INSERT INTO AUDIT_LOG (TABLE_NAME, RECORD_ID, ACTION_TYPE, OLD_VALUE, NEW_VALUE)
    VALUES ('PUBLICATION', v_record_id, v_action, v_old, v_new);
END TRG_PUBLICATION_AUDIT;
/
SHOW ERRORS


-- ---- TRG_USER_AUDIT ----------------------------------------------------
-- PASSWORD is deliberately excluded from every branch below, even
-- though :NEW.PASSWORD / :OLD.PASSWORD are technically accessible here.
CREATE OR REPLACE TRIGGER TRG_USER_AUDIT
AFTER INSERT OR UPDATE OR DELETE ON "USER"
FOR EACH ROW
DECLARE
    v_action    VARCHAR2(10);
    v_record_id NUMBER;
    v_old       CLOB;
    v_new       CLOB;
BEGIN
    IF INSERTING THEN
        v_action := 'INSERT';
        v_record_id := :NEW.USER_ID;
        v_new := 'FULL_NAME=' || :NEW.FULL_NAME || '; EMAIL=' || :NEW.EMAIL || '; ROLE_ID=' || :NEW.ROLE_ID;
    ELSIF UPDATING THEN
        v_action := 'UPDATE';
        v_record_id := :NEW.USER_ID;
        v_old := 'FULL_NAME=' || :OLD.FULL_NAME || '; EMAIL=' || :OLD.EMAIL || '; ROLE_ID=' || :OLD.ROLE_ID;
        v_new := 'FULL_NAME=' || :NEW.FULL_NAME || '; EMAIL=' || :NEW.EMAIL || '; ROLE_ID=' || :NEW.ROLE_ID;
    ELSIF DELETING THEN
        v_action := 'DELETE';
        v_record_id := :OLD.USER_ID;
        v_old := 'FULL_NAME=' || :OLD.FULL_NAME || '; EMAIL=' || :OLD.EMAIL || '; ROLE_ID=' || :OLD.ROLE_ID;
    END IF;

    INSERT INTO AUDIT_LOG (TABLE_NAME, RECORD_ID, ACTION_TYPE, OLD_VALUE, NEW_VALUE)
    VALUES ('USER', v_record_id, v_action, v_old, v_new);
END TRG_USER_AUDIT;
/
SHOW ERRORS


-- ---- TRG_REVIEW_AUDIT ---------------------------------------------------
CREATE OR REPLACE TRIGGER TRG_REVIEW_AUDIT
AFTER INSERT OR UPDATE OR DELETE ON REVIEW
FOR EACH ROW
DECLARE
    v_action    VARCHAR2(10);
    v_record_id NUMBER;
    v_old       CLOB;
    v_new       CLOB;
BEGIN
    IF INSERTING THEN
        v_action := 'INSERT';
        v_record_id := :NEW.REVIEW_ID;
        v_new := 'STATUS=' || :NEW.STATUS || '; SCORE=' || :NEW.SCORE || '; REVIEWER_ID=' || :NEW.REVIEWER_ID;
    ELSIF UPDATING THEN
        v_action := 'UPDATE';
        v_record_id := :NEW.REVIEW_ID;
        v_old := 'STATUS=' || :OLD.STATUS || '; SCORE=' || :OLD.SCORE;
        v_new := 'STATUS=' || :NEW.STATUS || '; SCORE=' || :NEW.SCORE;
    ELSIF DELETING THEN
        v_action := 'DELETE';
        v_record_id := :OLD.REVIEW_ID;
        v_old := 'STATUS=' || :OLD.STATUS || '; SCORE=' || :OLD.SCORE || '; REVIEWER_ID=' || :OLD.REVIEWER_ID;
    END IF;

    INSERT INTO AUDIT_LOG (TABLE_NAME, RECORD_ID, ACTION_TYPE, OLD_VALUE, NEW_VALUE)
    VALUES ('REVIEW', v_record_id, v_action, v_old, v_new);
END TRG_REVIEW_AUDIT;
/
SHOW ERRORS


-- ---- TRG_PROJECT_AUDIT --------------------------------------------------
CREATE OR REPLACE TRIGGER TRG_PROJECT_AUDIT
AFTER INSERT OR UPDATE OR DELETE ON PROJECT
FOR EACH ROW
DECLARE
    v_action    VARCHAR2(10);
    v_record_id NUMBER;
    v_old       CLOB;
    v_new       CLOB;
BEGIN
    IF INSERTING THEN
        v_action := 'INSERT';
        v_record_id := :NEW.PROJECT_ID;
        v_new := 'TITLE=' || :NEW.TITLE || '; STATUS=' || :NEW.STATUS || '; BUDGET=' || :NEW.BUDGET;
    ELSIF UPDATING THEN
        v_action := 'UPDATE';
        v_record_id := :NEW.PROJECT_ID;
        v_old := 'TITLE=' || :OLD.TITLE || '; STATUS=' || :OLD.STATUS || '; BUDGET=' || :OLD.BUDGET;
        v_new := 'TITLE=' || :NEW.TITLE || '; STATUS=' || :NEW.STATUS || '; BUDGET=' || :NEW.BUDGET;
    ELSIF DELETING THEN
        v_action := 'DELETE';
        v_record_id := :OLD.PROJECT_ID;
        v_old := 'TITLE=' || :OLD.TITLE || '; STATUS=' || :OLD.STATUS || '; BUDGET=' || :OLD.BUDGET;
    END IF;

    INSERT INTO AUDIT_LOG (TABLE_NAME, RECORD_ID, ACTION_TYPE, OLD_VALUE, NEW_VALUE)
    VALUES ('PROJECT', v_record_id, v_action, v_old, v_new);
END TRG_PROJECT_AUDIT;
/
SHOW ERRORS


-- ---- TRG_GRANT_FUNDING_AUDIT ---------------------------------------------
CREATE OR REPLACE TRIGGER TRG_GRANT_FUNDING_AUDIT
AFTER INSERT OR UPDATE OR DELETE ON GRANT_FUNDING
FOR EACH ROW
DECLARE
    v_action    VARCHAR2(10);
    v_record_id NUMBER;
    v_old       CLOB;
    v_new       CLOB;
BEGIN
    IF INSERTING THEN
        v_action := 'INSERT';
        v_record_id := :NEW.GRANT_ID;
        v_new := 'AMOUNT=' || :NEW.AMOUNT || '; PROJECT_ID=' || :NEW.PROJECT_ID || '; BODY_ID=' || :NEW.BODY_ID;
    ELSIF UPDATING THEN
        v_action := 'UPDATE';
        v_record_id := :NEW.GRANT_ID;
        v_old := 'AMOUNT=' || :OLD.AMOUNT;
        v_new := 'AMOUNT=' || :NEW.AMOUNT;
    ELSIF DELETING THEN
        v_action := 'DELETE';
        v_record_id := :OLD.GRANT_ID;
        v_old := 'AMOUNT=' || :OLD.AMOUNT || '; PROJECT_ID=' || :OLD.PROJECT_ID || '; BODY_ID=' || :OLD.BODY_ID;
    END IF;

    INSERT INTO AUDIT_LOG (TABLE_NAME, RECORD_ID, ACTION_TYPE, OLD_VALUE, NEW_VALUE)
    VALUES ('GRANT_FUNDING', v_record_id, v_action, v_old, v_new);
END TRG_GRANT_FUNDING_AUDIT;
/
SHOW ERRORS


