-- ================================================================
-- PASSWORD RECOVERY / OTP / 2FA (database side)
--
-- Two things:
--   1. AUTH_OTP — stores ONLY a bcrypt hash of every OTP ever issued
--      (never the raw code), with expiry, attempt count, and a used
--      flag. Reused for both password-reset OTPs and 2FA login OTPs
--      via the PURPOSE column.
--   2. USER.PASSWORD_CHANGED_AT — lets the backend invalidate every
--      existing JWT the moment a password changes, by embedding this
--      timestamp in the token at login and comparing it against the
--      live value on every authenticated request.
--
--   sqlplus RPMS_APP/your_password@localhost:1521/ORCLPDB @password_security.sql
-- ================================================================

ALTER TABLE "USER" ADD PASSWORD_CHANGED_AT TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL;

CREATE TABLE AUTH_OTP (
    OTP_ID        NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    USER_ID       NUMBER NOT NULL,
    OTP_HASH      VARCHAR2(255) NOT NULL,
    PURPOSE       VARCHAR2(20) NOT NULL CHECK (PURPOSE IN ('PASSWORD_RESET', '2FA')),
    EXPIRES_AT    TIMESTAMP NOT NULL,
    ATTEMPT_COUNT NUMBER DEFAULT 0 NOT NULL,
    MAX_ATTEMPTS  NUMBER DEFAULT 5 NOT NULL,
    IS_USED       NUMBER(1) DEFAULT 0 NOT NULL CHECK (IS_USED IN (0, 1)),
    CREATED_AT    TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT FK_OTP_USER FOREIGN KEY (USER_ID) REFERENCES "USER"(USER_ID) ON DELETE CASCADE
);

-- "Does this user have a live OTP for this purpose" is the hot lookup path
-- on every verify attempt and every resend-rate-limit check.
CREATE INDEX IDX_OTP_USER_PURPOSE ON AUTH_OTP(USER_ID, PURPOSE, IS_USED);
CREATE INDEX IDX_OTP_EXPIRES      ON AUTH_OTP(EXPIRES_AT);


-- ---- RESET_PASSWORD -------------------------------------------------
-- The database-side portion of password recovery (master plan, PL/SQL
-- procedure #7). Node does the actual bcrypt hashing (that's an
-- application-layer concern, not something Oracle should do) — this
-- procedure's job is the two things that must happen ATOMICALLY:
-- storing the new hash and bumping PASSWORD_CHANGED_AT together, so a
-- JWT issued a split second before a reset can never slip through.
-- The hash is the ONLY thing this procedure ever touches — the raw
-- password and the OTP never reach the database in any form.
-- NOTE: parameters use plain NUMBER/VARCHAR2 rather than anchoring to
-- "USER".USER_ID%TYPE / "USER".PASSWORD%TYPE. USER is a reserved PL/SQL
-- pseudo-function (returns the current DB session's username) as well as
-- this project's table name, and the compiler rejects the %TYPE anchor
-- even when the table name is quoted (PLS-00225) — same issue already
-- fixed once in procedures_functions.sql.


CREATE OR REPLACE PROCEDURE RESET_PASSWORD (
    p_user_id           IN NUMBER,
    p_new_password_hash IN VARCHAR2
) AS
    v_dummy NUMBER;
BEGIN
    BEGIN
        SELECT 1 INTO v_dummy FROM "USER" WHERE USER_ID = p_user_id;
    EXCEPTION WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20070, 'User ' || p_user_id || ' does not exist.');
    END;

    IF p_new_password_hash IS NULL OR LENGTH(p_new_password_hash) < 20 THEN
        -- A bcrypt hash is always 60 chars; anything drastically shorter
        -- means a caller bug upstream, not a real hash. Refuse rather
        -- than silently storing garbage into the PASSWORD column.
        RAISE_APPLICATION_ERROR(-20071, 'Invalid password hash supplied.');
    END IF;

    UPDATE "USER"
    SET PASSWORD = p_new_password_hash,
        PASSWORD_CHANGED_AT = SYSTIMESTAMP
    WHERE USER_ID = p_user_id;

    COMMIT;
END RESET_PASSWORD;
/
SHOW ERRORS

-- ================================================================
-- Verify afterward:
--   SELECT column_name FROM user_tab_columns
--   WHERE table_name = 'USER' AND column_name = 'PASSWORD_CHANGED_AT';
--
--   SELECT table_name FROM user_tables WHERE table_name = 'AUTH_OTP';
--
--   SELECT object_name, status FROM user_objects
--   WHERE object_name = 'RESET_PASSWORD';
-- ================================================================
