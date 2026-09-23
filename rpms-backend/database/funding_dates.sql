

ALTER TABLE GRANT_FUNDING ADD GRANT_DATE DATE DEFAULT SYSDATE NOT NULL;
CREATE INDEX IDX_GRANT_DATE ON GRANT_FUNDING(GRANT_DATE);

ALTER TABLE AWARD ADD AWARD_DATE DATE DEFAULT SYSDATE NOT NULL;
CREATE INDEX IDX_AWARD_DATE ON AWARD(AWARD_DATE);

-- Deliberately NOT adding a constraint that blocks a project's total
-- grants from exceeding PROJECT.BUDGET. In real research funding,
-- grants routinely arrive from multiple bodies and can legitimately
-- exceed an original budget estimate — that's a reporting question
-- ("projects exceeding budget"), not something the database should
-- refuse to store.

COMMIT;


