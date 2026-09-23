-- ================================================================
-- RPMS — GRANT MISSING PRIVILEGES TO RPMS_APP
--
-- Run this connected as an ADMIN account, NOT as RPMS_APP.
-- Typically that's SYSTEM (the password you set when installing
-- Oracle / creating the PDB), connected to the same PDB:
--
--   sqlplus SYSTEM/your_system_password@localhost:1521/ORCLPDB @grant_privileges.sql
--
-- RPMS_APP currently only has enough privilege to create TABLES
-- (which is why schema.sql through Block 8 all worked) but not
-- views, procedures, functions, or triggers — those are separate
-- privileges that a plain schema user doesn't get automatically.
-- ================================================================

GRANT CREATE VIEW      TO RPMS_APP;
GRANT CREATE PROCEDURE TO RPMS_APP;  -- also covers standalone FUNCTIONS
GRANT CREATE TRIGGER   TO RPMS_APP;
GRANT CREATE SEQUENCE  TO RPMS_APP;  -- harmless to grant now, avoids a future wall

-- ================================================================
-- Verify (also run as SYSTEM):
--   SELECT PRIVILEGE FROM DBA_SYS_PRIVS WHERE GRANTEE = 'RPMS_APP'
--   ORDER BY PRIVILEGE;
--   -- should now include CREATE VIEW, CREATE PROCEDURE, CREATE TRIGGER, CREATE SEQUENCE
-- ================================================================
