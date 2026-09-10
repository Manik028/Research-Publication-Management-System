const { executeQuery, insertReturningId } = require('../config/db');

const NOTIF_SELECT = `
    SELECT NOTIF_ID AS ID, CATEGORY, MESSAGE, IS_READ, CREATED_AT, USER_ID
    FROM NOTIFICATION
`;

const NotificationModel = {
    getByUser: async (userId) => {
        const result = await executeQuery(
            `${NOTIF_SELECT} WHERE USER_ID = :userId ORDER BY IS_READ ASC, CREATED_AT DESC, NOTIF_ID DESC`,
            { userId }
        );
        return result.rows;
    },

    getById: async (id) => {
        const result = await executeQuery(`${NOTIF_SELECT} WHERE NOTIF_ID = :id`, { id });
        return result.rows[0];
    },

    create: async ({ category, message, userId }) => {
        const sql = `
            INSERT INTO NOTIFICATION (CATEGORY, MESSAGE, USER_ID)
            VALUES (:category, :message, :userId)
            RETURNING NOTIF_ID INTO :newId
        `;
        return insertReturningId(sql, { category: category || null, message, userId });
    },

    markAsRead: async (id) => {
        const result = await executeQuery(
            `UPDATE NOTIFICATION SET IS_READ = 1 WHERE NOTIF_ID = :id`, { id }
        );
        return result.rowsAffected;
    },

    remove: async (id) => {
        const result = await executeQuery(`DELETE FROM NOTIFICATION WHERE NOTIF_ID = :id`, { id });
        return result.rowsAffected;
    },
};

module.exports = NotificationModel;
