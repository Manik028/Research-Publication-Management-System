const { executeQuery, insertReturningId } = require('../config/db');

// FILE is a reserved-ish word in Oracle, so the table is quoted everywhere.
const FILE_SELECT = `
    SELECT f.FILE_ID        AS ID,
           f.FILE_NAME,
           f.FILE_TYPE,
           f.FILE_SIZE,
           f.UPLOAD_DATE,
           f.PUBLICATION_ID,
           p.TITLE          AS PUBLICATION_TITLE,
           p.USER_ID        AS OWNER_ID
    FROM "FILE" f
    JOIN PUBLICATION p ON f.PUBLICATION_ID = p.PUBLICATION_ID
`;

const FileModel = {
    getAll: async () => {
        const result = await executeQuery(`${FILE_SELECT} ORDER BY f.UPLOAD_DATE DESC, f.FILE_ID DESC`);
        return result.rows;
    },

    getByPublication: async (publicationId) => {
        const result = await executeQuery(
            `${FILE_SELECT} WHERE f.PUBLICATION_ID = :publicationId ORDER BY f.FILE_ID DESC`,
            { publicationId }
        );
        return result.rows;
    },

    getById: async (id) => {
        const result = await executeQuery(`${FILE_SELECT} WHERE f.FILE_ID = :id`, { id });
        return result.rows[0];
    },

    create: async ({ fileName, fileType, fileSize, publicationId }) => {
        const sql = `
            INSERT INTO "FILE" (FILE_NAME, FILE_TYPE, FILE_SIZE, PUBLICATION_ID)
            VALUES (:fileName, :fileType, :fileSize, :publicationId)
            RETURNING FILE_ID INTO :newId
        `;
        return insertReturningId(sql, {
            fileName,
            fileType: fileType || null,
            fileSize: fileSize === undefined || fileSize === null ? null : fileSize,
            publicationId,
        });
    },

    remove: async (id) => {
        const result = await executeQuery(`DELETE FROM "FILE" WHERE FILE_ID = :id`, { id });
        return result.rowsAffected;
    },
};

module.exports = FileModel;
