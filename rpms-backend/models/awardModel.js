const { executeQuery, insertReturningId } = require('../config/db');

const AWARD_SELECT = `
    SELECT a.AWARD_ID  AS ID,
           a.AWARD_NAME,
           a.CATEGORY,
           a.AWARDING_ORGANIZATION,
           a.USER_ID,
           u.FULL_NAME AS RECIPIENT
    FROM AWARD a
    JOIN "USER" u ON a.USER_ID = u.USER_ID
`;

const AwardModel = {
    getAll: async () => {
        const result = await executeQuery(`${AWARD_SELECT} ORDER BY a.AWARD_ID DESC`);
        return result.rows;
    },

    getByUser: async (userId) => {
        const result = await executeQuery(
            `${AWARD_SELECT} WHERE a.USER_ID = :userId ORDER BY a.AWARD_ID DESC`,
            { userId }
        );
        return result.rows;
    },

    getById: async (id) => {
        const result = await executeQuery(`${AWARD_SELECT} WHERE a.AWARD_ID = :id`, { id });
        return result.rows[0];
    },

    create: async ({ awardName, category, awardingOrganization, userId }) => {
        const sql = `
            INSERT INTO AWARD (AWARD_NAME, CATEGORY, AWARDING_ORGANIZATION, USER_ID)
            VALUES (:awardName, :category, :awardingOrganization, :userId)
            RETURNING AWARD_ID INTO :newId
        `;
        return insertReturningId(sql, {
            awardName,
            category: category || null,
            awardingOrganization: awardingOrganization || null,
            userId,
        });
    },

    remove: async (id) => {
        const result = await executeQuery(`DELETE FROM AWARD WHERE AWARD_ID = :id`, { id });
        return result.rowsAffected;
    },
};

module.exports = AwardModel;
