
CREATE TABLE PROJECT_MEMBER (
    PROJECT_ID  NUMBER NOT NULL,
    USER_ID     NUMBER NOT NULL,
    MEMBER_ROLE VARCHAR2(50) DEFAULT 'Researcher'
                CHECK (MEMBER_ROLE IN ('Lead', 'Researcher', 'Collaborator', 'Advisor')),
    JOIN_DATE   DATE DEFAULT SYSDATE,
    PRIMARY KEY (PROJECT_ID, USER_ID),
    CONSTRAINT FK_PM_PROJECT FOREIGN KEY (PROJECT_ID) REFERENCES PROJECT(PROJECT_ID) ON DELETE CASCADE,
    CONSTRAINT FK_PM_USER    FOREIGN KEY (USER_ID)    REFERENCES "USER"(USER_ID) ON DELETE CASCADE
);

-- PROJECT_ID is already the leading PK column (fast "members of project X"
-- lookups); this covers the reverse direction ("which projects is this
-- researcher on").
CREATE INDEX IDX_PM_USER ON PROJECT_MEMBER(USER_ID);

-- Duplicate membership (same person added twice to the same project)
-- is already impossible: PROJECT_ID+USER_ID is the primary key, so a
-- second INSERT with the same pair fails with ORA-00001 automatically.
-- No extra constraint needed for that.

COMMIT;


