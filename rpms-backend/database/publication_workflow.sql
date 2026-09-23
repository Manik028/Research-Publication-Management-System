

-- ---- 1. Full publication lifecycle -----------------------------------
ALTER TABLE PUBLICATION DROP CONSTRAINT CK_PUB_STATUS;

ALTER TABLE PUBLICATION MODIFY CONFIRMATION_STATUS DEFAULT 'Draft';

ALTER TABLE PUBLICATION
    ADD CONSTRAINT CK_PUB_STATUS
    CHECK (CONFIRMATION_STATUS IN (
        'Draft', 'Submitted', 'Under Review', 'Revision Required',
        'Resubmitted', 'Accepted', 'Rejected', 'Published', 'Archived'
    ));


-- ---- 2. Author order + corresponding author on AUTHOR_PUBLICATION ----
ALTER TABLE AUTHOR_PUBLICATION ADD AUTHOR_ORDER NUMBER;

ALTER TABLE AUTHOR_PUBLICATION
    ADD CONSTRAINT CK_AP_ORDER CHECK (AUTHOR_ORDER IS NULL OR AUTHOR_ORDER > 0);

-- No two authors on the SAME publication can share the same order
-- number. Oracle UNIQUE constraints allow any number of NULLs, so
-- rows where AUTHOR_ORDER hasn't been set yet are unaffected.
ALTER TABLE AUTHOR_PUBLICATION
    ADD CONSTRAINT UQ_AP_ORDER UNIQUE (PUBLICATION_ID, AUTHOR_ORDER);

ALTER TABLE AUTHOR_PUBLICATION
    ADD IS_CORRESPONDING NUMBER(1) DEFAULT 0
        CHECK (IS_CORRESPONDING IN (0, 1));

-- At most ONE corresponding author per publication. A plain UNIQUE
-- constraint on (PUBLICATION_ID, IS_CORRESPONDING) wouldn't work here
-- (it would also block having two NON-corresponding authors on the
-- same paper). A unique index on an expression that evaluates to
-- NULL for non-corresponding rows solves it: Oracle unique indexes
-- ignore NULLs entirely, so only the IS_CORRESPONDING=1 rows are
-- checked for uniqueness.
CREATE UNIQUE INDEX UQ_AP_ONE_CORRESPONDING
    ON AUTHOR_PUBLICATION (CASE WHEN IS_CORRESPONDING = 1 THEN PUBLICATION_ID END);

COMMIT;


