-- ================================================================
-- Seed data for RPMS.
-- Run AFTER schema.sql:
--   sqlplus rpms_user/your_password@localhost:1521/orcl @seed.sql
--
-- The three roles are mandatory: authController looks the ROLE_ID up by
-- ROLE_NAME, and the Register page offers exactly these three values.
-- Everything below the roles is optional demo data.
-- ================================================================

-- ---- Roles (required) ------------------------------------------
INSERT INTO "ROLE" (ROLE_NAME, DESCRIPTION)
VALUES ('Admin', 'Full system access, including moderation and venue management');

INSERT INTO "ROLE" (ROLE_NAME, DESCRIPTION)
VALUES ('Manager', 'Manages research projects, grants, and venues');

INSERT INTO "ROLE" (ROLE_NAME, DESCRIPTION)
VALUES ('Researcher', 'Standard account for publications, projects, and peer review');

-- ---- Venues (optional demo data) -------------------------------
-- Gives the public Conferences and Journals pages something to render.
INSERT INTO VENUE (NAME, TYPE, SUBMISSION_DEADLINE, STATUS)
VALUES ('International Conference on Software Engineering', 'Conference', DATE '2026-11-15', 'Open');

INSERT INTO VENUE (NAME, TYPE, SUBMISSION_DEADLINE, STATUS)
VALUES ('IEEE International Conference on Data Engineering', 'Conference', DATE '2026-10-01', 'Open');

INSERT INTO VENUE (NAME, TYPE, SUBMISSION_DEADLINE, STATUS)
VALUES ('Journal of Systems and Software', 'Journal', DATE '2026-12-31', 'Open');

INSERT INTO VENUE (NAME, TYPE, SUBMISSION_DEADLINE, STATUS)
VALUES ('ACM Transactions on Database Systems', 'Journal', NULL, 'Open');

-- ---- Research areas (optional demo data) -----------------------
INSERT INTO RESEARCH_AREA (AREA_NAME, DESCRIPTION)
VALUES ('Database Systems', 'Storage engines, query optimisation and transaction processing.');

INSERT INTO RESEARCH_AREA (AREA_NAME, DESCRIPTION)
VALUES ('Machine Learning', 'Statistical learning, deep learning and their applications.');

INSERT INTO RESEARCH_AREA (AREA_NAME, DESCRIPTION)
VALUES ('Software Engineering', 'Design, testing, maintenance and process of software systems.');

-- ---- Institutions (optional demo data) -------------------------
INSERT INTO INSTITUTION (NAME, COUNTRY, WEBSITE)
VALUES ('University of Dhaka', 'Bangladesh', 'https://du.ac.bd');

INSERT INTO INSTITUTION (NAME, COUNTRY, WEBSITE)
VALUES ('Bangladesh University of Engineering and Technology', 'Bangladesh', 'https://buet.ac.bd');

-- ---- Funding bodies (optional demo data) -----------------------
INSERT INTO FUNDING_BODY (NAME, ORGANIZATION_TYPE)
VALUES ('National Science Foundation', 'Government');

INSERT INTO FUNDING_BODY (NAME, ORGANIZATION_TYPE)
VALUES ('University Grants Commission', 'Government');

COMMIT;

-- NOTE: no user rows are seeded, because PASSWORD stores a bcrypt hash.
-- Create your first account through the Register page in the UI.
