create or replace procedure create_publication_full (
   p_title              in publication.title%type,
   p_abstract           in publication.abstract%type,
   p_doi                in publication.doi%type,
   p_venue_id           in publication.venue_id%type,
   p_owner_user_id      in publication.user_id%type,
   p_author_ids         in varchar2,   -- e.g. '3,5,9' — first ID = corresponding author
   p_area_ids           in varchar2 default null,
   p_new_publication_id out number
) as
   v_pub_id number;
   v_order  number := 1;
begin
   insert into publication (
      title,
      abstract,
      doi,
      venue_id,
      user_id
   ) values
      ( p_title,
        p_abstract,
        p_doi,
        p_venue_id,
        p_owner_user_id )
   returning publication_id into v_pub_id;

   for rec in (
      select trim(regexp_substr(
         p_author_ids,
         '[^,]+',
         1,
         level
      )) as aid
        from dual
      connect by
         regexp_substr(
            p_author_ids,
            '[^,]+',
            1,
            level
         ) is not null
   ) loop
      insert into author_publication (
         user_id,
         publication_id,
         author_order,
         is_corresponding
      ) values
         ( to_number(rec.aid),
           v_pub_id,
           v_order,
           case
              when v_order = 1 then
                  1
              else
                 0
           end
         );
      v_order := v_order + 1;
   end loop;

   if p_area_ids is not null then
      for rec in (
         select trim(regexp_substr(
            p_area_ids,
            '[^,]+',
            1,
            level
         )) as aid
           from dual
         connect by
            regexp_substr(
               p_area_ids,
               '[^,]+',
               1,
               level
            ) is not null
      ) loop
         insert into publication_research_area (
            publication_id,
            area_id
         ) values
            ( v_pub_id,
              to_number(rec.aid) );
      end loop;
   end if;

   commit;
   p_new_publication_id := v_pub_id;
   dbms_output.put_line('Created PUBLICATION_ID '
                        || v_pub_id || ' with authors and research areas.');
exception
   when others then
      rollback;
      raise_application_error(
         -20060,
         'CREATE_PUBLICATION_FULL failed and was fully rolled back (nothing saved): ' || sqlerrm
      );
end create_publication_full;
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
create or replace procedure assign_reviewer (
   p_publication_id in review.publication_id%type,
   p_reviewer_id    in review.reviewer_id%type,
   p_deadline       in review.deadline%type
) as
   v_dummy         number;
   v_author_count  number;
   v_review_count  number;
   c_max_reviewers constant number := 3;
begin
   begin
        -- FOR UPDATE locks this PUBLICATION row for the rest of the
        -- transaction. A second session calling this procedure for the
        -- SAME publication blocks here until this transaction commits.
      select 1
        into v_dummy
        from publication
       where publication_id = p_publication_id
      for update;
   exception
      when no_data_found then
         raise_application_error(
            -20001,
            'Publication '
            || p_publication_id
            || ' does not exist.'
         );
   end;

   begin
      select 1
        into v_dummy
        from "USER"
       where user_id = p_reviewer_id;
   exception
      when no_data_found then
         raise_application_error(
            -20002,
            'Reviewer '
            || p_reviewer_id
            || ' does not exist.'
         );
   end;

   select count(*)
     into v_author_count
     from author_publication
    where publication_id = p_publication_id
      and user_id = p_reviewer_id;

   if v_author_count > 0 then
      raise_application_error(
         -20003,
         'A reviewer cannot be assigned to review their own publication.'
      );
   end if;
   if p_deadline <= sysdate then
      raise_application_error(
         -20004,
         'Review deadline must be a future date.'
      );
   end if;

    -- Safe to check now — the FOR UPDATE lock above guarantees no other
    -- session can be mid-insert for this same publication right now.
   select count(*)
     into v_review_count
     from review
    where publication_id = p_publication_id;

   if v_review_count >= c_max_reviewers then
      raise_application_error(
         -20006,
         'Publication '
         || p_publication_id
         || ' already has the maximum of '
         || c_max_reviewers
         || ' reviewers assigned.'
      );
   end if;

   begin
      insert into review (
         publication_id,
         reviewer_id,
         deadline,
         status
      ) values
         ( p_publication_id,
           p_reviewer_id,
           p_deadline,
           'Pending' );
   exception
      when dup_val_on_index then
         raise_application_error(
            -20005,
            'This reviewer is already assigned to this publication.'
         );
   end;

   commit;  -- releases the FOR UPDATE lock
end assign_reviewer;
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