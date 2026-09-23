-- ================================================================
--  TRIGGERS
--
-- Only two triggers here — both solve a real problem. Two more
-- trigger types from the original plan (publication audit trail,
-- security/role-change audit) are DELIBERATELY deferred to Block 13,
-- because they need the AUDIT_LOG table, which doesn't exist yet.
-- Creating them now against a non-existent table isn't possible, and
-- padding this block with an unrelated trigger just to hit a count
-- would go against the "no pointless triggers" rule from the start.
--
--   sqlplus RPMS_APP/your_password@localhost:1521/ORCLPDB @triggers.sql
-- ================================================================


-- ---- TRG_REVIEW_COMPLETED_NOTIFY -----------------------------------------
-- When a review flips from any status to 'Completed', automatically
-- notify the publication's owner. This is the exact scenario from the
-- original plan: "Reviewer submits review -> REVIEW updated -> trigger
-- fires -> NOTIFICATION created" — no backend code has to remember to
-- do this; it happens no matter HOW the row gets updated.

create or replace trigger trg_review_completed_notify after
   update of status on review
   for each row
   when ( new.status = 'Completed'
      and old.status != 'Completed' )
declare
   v_owner_id  number;
   v_pub_title varchar2(200);
begin
   select user_id,
          title
     into
      v_owner_id,
      v_pub_title
     from publication
    where publication_id = :new.publication_id;

   insert into notification (
      category,
      message,
      user_id
   ) values
      ( 'Review Completed',
        'A review for your publication "'
        || v_pub_title
        || '" has been completed.',
        v_owner_id );
end trg_review_completed_notify;
/
SHOW ERRORS


-- ---- TRG_PUBLICATION_STATUS_GUARD ----------------------------------------
-- Enforces the Block 6 lifecycle at the DATABASE level — this fires
-- regardless of whether the status change comes from APPROVE_PUBLICATION/
-- REJECT_PUBLICATION (Block 10), a future Express endpoint, or someone
-- running a raw UPDATE directly in SQL Developer. No path around it.
--
-- Allowed transitions (matches what Block 10's procedures already do):
--   Draft             -> Submitted
--   Submitted         -> Under Review
--   Under Review      -> Revision Required, Accepted, Rejected
--   Resubmitted       -> Under Review, Revision Required, Accepted, Rejected
--   Revision Required -> Resubmitted
--   Accepted          -> Published
--   Published         -> Archived
--   Rejected          -> Archived
-- Anything else (e.g. Draft -> Published, or Rejected -> Accepted) is refused.
create or replace trigger trg_publication_status_guard before
   update of confirmation_status on publication
   for each row
declare
   v_allowed boolean := false;
begin
   if :old.confirmation_status = :new.confirmation_status then
      v_allowed := true;
   elsif
      :old.confirmation_status = 'Draft'
      and :new.confirmation_status = 'Submitted'
   then
      v_allowed := true;
   elsif
      :old.confirmation_status = 'Submitted'
      and :new.confirmation_status = 'Under Review'
   then
      v_allowed := true;
   elsif
      :old.confirmation_status in ( 'Under Review',
                                    'Resubmitted' )
      and :new.confirmation_status in ( 'Revision Required',
                                        'Accepted',
                                        'Rejected' )
   then
      v_allowed := true;
   elsif
      :old.confirmation_status = 'Resubmitted'
      and :new.confirmation_status = 'Under Review'
   then
      v_allowed := true;
   elsif
      :old.confirmation_status = 'Revision Required'
      and :new.confirmation_status = 'Resubmitted'
   then
      v_allowed := true;
   elsif
      :old.confirmation_status = 'Accepted'
      and :new.confirmation_status = 'Published'
   then
      v_allowed := true;
   elsif
      :old.confirmation_status in ( 'Published',
                                    'Rejected' )
      and :new.confirmation_status = 'Archived'
   then
      v_allowed := true;
   end if;

   if not v_allowed then
      raise_application_error(
         -20050,
         'Invalid publication status transition: "'
         || :old.confirmation_status
         || '" -> "'
         || :new.confirmation_status
         || '".'
      );
   end if;
end trg_publication_status_guard;
/
SHOW ERRORS

-- ================================================================
-- Verify afterward:
--   SELECT trigger_name, status FROM user_triggers ORDER BY trigger_name;
--   -- both should say ENABLED
--
-- Test 1 — invalid jump should FAIL with your custom -20050 error
-- (use a real PUBLICATION_ID that's currently 'Draft'):
--   UPDATE PUBLICATION SET CONFIRMATION_STATUS = 'Published' WHERE PUBLICATION_ID = 1;
--
-- Test 2 — valid step-by-step transition should SUCCEED:
--   UPDATE PUBLICATION SET CONFIRMATION_STATUS = 'Submitted' WHERE PUBLICATION_ID = 1;
--
-- Test 3 — review completion notification (use a real REVIEW_ID that's
-- currently 'Pending'):
--   UPDATE REVIEW SET STATUS = 'Completed' WHERE REVIEW_ID = 1;
--   SELECT * FROM NOTIFICATION ORDER BY NOTIF_ID DESC FETCH FIRST 1 ROWS ONLY;
--   -- should show a new "Review Completed" row
-- ================================================================