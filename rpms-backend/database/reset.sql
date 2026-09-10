-- ================================================================
-- Drops every RPMS object so schema.sql can be re-run from scratch.
-- Ignore "table or view does not exist" errors on a fresh schema.
-- Run as the RPMS schema owner.
-- ================================================================

BEGIN
    FOR t IN (
        SELECT table_name FROM user_tables
        WHERE table_name IN (
            'NOTIFICATION', 'MODERATION_QUEUE', 'AWARD', 'GRANT_FUNDING',
            'FUNDING_BODY', 'PROJECT', 'REVIEW', 'FILE', 'AUTHOR_PUBLICATION',
            'PUBLICATION', 'VENUE', 'RESEARCH_AREA', 'INSTITUTION', 'USER', 'ROLE'
        )
    ) LOOP
        EXECUTE IMMEDIATE 'DROP TABLE "' || t.table_name || '" CASCADE CONSTRAINTS PURGE';
    END LOOP;
END;
/

COMMIT;
