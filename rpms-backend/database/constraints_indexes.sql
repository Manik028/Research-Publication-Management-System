

-- ---- VENUE.STATUS ------------------------------------------------
ALTER TABLE VENUE
    ADD CONSTRAINT CK_VENUE_STATUS
    CHECK (STATUS IN ('Open', 'Closed'));

-- ---- PUBLICATION.CONFIRMATION_STATUS ------------------------------
-- Basic guard for now; full lifecycle (Draft/Submitted/Under Review/...)
-- lands in Block 6 once the workflow rules are designed.
ALTER TABLE PUBLICATION
    ADD CONSTRAINT CK_PUB_STATUS
    CHECK (CONFIRMATION_STATUS IN ('Pending', 'Accepted', 'Rejected', 'Published'));

CREATE INDEX IDX_PUB_STATUS ON PUBLICATION(CONFIRMATION_STATUS);

-- ---- REVIEW.STATUS -------------------------------------------------
ALTER TABLE REVIEW
    ADD CONSTRAINT CK_REVIEW_STATUS
    CHECK (STATUS IN ('Pending', 'Completed', 'Overdue', 'Cancelled'));

CREATE INDEX IDX_REVIEW_STATUS ON REVIEW(STATUS);

-- Deadline is queried constantly for "overdue reviews" reports.
CREATE INDEX IDX_REVIEW_DEADLINE ON REVIEW(DEADLINE);

-- ---- REVIEW.OVERALL_RECOMMENDATION ----------------------------------
-- Nullable is fine (no recommendation until the review is submitted),
-- but once set it must be one of the real editorial outcomes.
ALTER TABLE REVIEW
    ADD CONSTRAINT CK_REVIEW_RECOMMENDATION
    CHECK (OVERALL_RECOMMENDATION IS NULL
           OR OVERALL_RECOMMENDATION IN ('Accept', 'Minor Revision', 'Major Revision', 'Reject'));

-- ---- PROJECT.STATUS --------------------------------------------------
ALTER TABLE PROJECT
    ADD CONSTRAINT CK_PROJECT_STATUS
    CHECK (STATUS IN ('Planned', 'Active', 'Completed', 'On Hold', 'Cancelled'));

CREATE INDEX IDX_PROJECT_STATUS ON PROJECT(STATUS);

-- ---- MODERATION_QUEUE.STATUS / ITEM_TYPE ------------------------------
ALTER TABLE MODERATION_QUEUE
    ADD CONSTRAINT CK_MOD_STATUS
    CHECK (STATUS IN ('Pending', 'Reviewed', 'Resolved', 'Dismissed'));

ALTER TABLE MODERATION_QUEUE
    ADD CONSTRAINT CK_MOD_ITEM_TYPE
    CHECK (ITEM_TYPE IN ('PUBLICATION', 'REVIEW', 'USER'));

CREATE INDEX IDX_MOD_STATUS ON MODERATION_QUEUE(STATUS);

-- ---- NOTIFICATION lookups ----------------------------------------------
-- "unread notifications for this user" is the single most common
-- notification query; IDX_NOTIF_USER (schema.sql) only covers USER_ID,
-- so add a composite index that also covers the IS_READ filter.
CREATE INDEX IDX_NOTIF_USER_READ ON NOTIFICATION(USER_ID, IS_READ);

COMMIT;

-- ================================================================
-- Verify afterward with:
--   SELECT constraint_name, table_name, constraint_type, status
--   FROM user_constraints
--   WHERE constraint_name LIKE 'CK_%'
--   ORDER BY table_name;
--
--   SELECT index_name, table_name FROM user_indexes
--   WHERE index_name LIKE 'IDX_%'
--   ORDER BY table_name;
-- ================================================================
