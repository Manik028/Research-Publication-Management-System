const { executeQuery, insertReturningId } = require('../config/db');

const MOD_SELECT = `
    SELECT MOD_ID AS ID, ITEM_TYPE, REFERENCE_ID, FLAG_REASON, STATUS, ACTION_TAKEN
    FROM MODERATION_QUEUE
`;

const ModerationModel = {
    getAll: async (status) => {
        if (status) {
            const result = await executeQuery(
                `${MOD_SELECT} WHERE UPPER(STATUS) = UPPER(:status) ORDER BY MOD_ID DESC`,
                { status }
            );
            return result.rows;
        }
        const result = await executeQuery(`${MOD_SELECT} ORDER BY MOD_ID DESC`);
        return result.rows;
    },

    getById: async (id) => {
        const result = await executeQuery(`${MOD_SELECT} WHERE MOD_ID = :id`, { id });
        return result.rows[0];
    },

    create: async ({ itemType, referenceId, flagReason }) => {
        const sql = `
            INSERT INTO MODERATION_QUEUE (ITEM_TYPE, REFERENCE_ID, FLAG_REASON)
            VALUES (:itemType, :referenceId, :flagReason)
            RETURNING MOD_ID INTO :newId
        `;
        return insertReturningId(sql, { itemType, referenceId, flagReason });
    },

    resolve: async (id, { status, actionTaken }) => {
        const sql = `
            UPDATE MODERATION_QUEUE
            SET STATUS       = NVL(:status, STATUS),
                ACTION_TAKEN = NVL(:actionTaken, ACTION_TAKEN)
            WHERE MOD_ID = :id
        `;
        const result = await executeQuery(sql, {
            status: status || null,
            actionTaken: actionTaken || null,
            id,
        });
        return result.rowsAffected;
    },
};

module.exports = ModerationModel;
