const { executeQuery, insertReturningId } = require('../config/db');

const GRANT_SELECT = `
    SELECT g.GRANT_ID     AS ID,
           g.AMOUNT,
           g.PROJECT_ID,
           p.TITLE        AS PROJECT_TITLE,
           p.MANAGER_ID,
           g.BODY_ID,
           b.NAME         AS FUNDING_BODY,
           b.ORGANIZATION_TYPE
    FROM GRANT_FUNDING g
    JOIN PROJECT p ON g.PROJECT_ID = p.PROJECT_ID
    JOIN FUNDING_BODY b ON g.BODY_ID = b.BODY_ID
`;

const GrantModel = {
    getAll: async () => {
        const result = await executeQuery(`${GRANT_SELECT} ORDER BY g.GRANT_ID DESC`);
        return result.rows;
    },

    getById: async (id) => {
        const result = await executeQuery(`${GRANT_SELECT} WHERE g.GRANT_ID = :id`, { id });
        return result.rows[0];
    },

    /**
     * Funding bodies are unique by NAME, so a grant logged against a body that
     * does not exist yet creates it first. This is what lets the Grants page
     * submit a plain funding-body name instead of a BODY_ID.
     */
    findOrCreateFundingBody: async (name, organizationType = null) => {
        const existing = await executeQuery(
            `SELECT BODY_ID, NAME FROM FUNDING_BODY WHERE UPPER(NAME) = UPPER(:name)`,
            { name }
        );
        if (existing.rows[0]) return existing.rows[0].BODY_ID;

        return insertReturningId(
            `INSERT INTO FUNDING_BODY (NAME, ORGANIZATION_TYPE)
             VALUES (:name, :organizationType)
             RETURNING BODY_ID INTO :newId`,
            { name, organizationType }
        );
    },

    getFundingBodies: async () => {
        const result = await executeQuery(
            `SELECT BODY_ID AS ID, NAME, ORGANIZATION_TYPE FROM FUNDING_BODY ORDER BY NAME`
        );
        return result.rows;
    },

    create: async ({ amount, projectId, bodyId }) => {
        const sql = `
            INSERT INTO GRANT_FUNDING (AMOUNT, PROJECT_ID, BODY_ID)
            VALUES (:amount, :projectId, :bodyId)
            RETURNING GRANT_ID INTO :newId
        `;
        return insertReturningId(sql, { amount, projectId, bodyId });
    },

    remove: async (id) => {
        const result = await executeQuery(`DELETE FROM GRANT_FUNDING WHERE GRANT_ID = :id`, { id });
        return result.rowsAffected;
    },
};

module.exports = GrantModel;
