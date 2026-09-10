const { executeQuery, insertReturningId } = require('../config/db');

const INSTITUTION_SELECT = `
    SELECT INSTITUTION_ID AS ID, NAME, COUNTRY, WEBSITE
    FROM INSTITUTION
`;

const InstitutionModel = {
    getAll: async () => {
        const result = await executeQuery(`${INSTITUTION_SELECT} ORDER BY NAME`);
        return result.rows;
    },

    getById: async (id) => {
        const result = await executeQuery(`${INSTITUTION_SELECT} WHERE INSTITUTION_ID = :id`, { id });
        return result.rows[0];
    },

    create: async ({ name, country, website }) => {
        const sql = `
            INSERT INTO INSTITUTION (NAME, COUNTRY, WEBSITE)
            VALUES (:name, :country, :website)
            RETURNING INSTITUTION_ID INTO :newId
        `;
        return insertReturningId(sql, { name, country, website: website || null });
    },

    remove: async (id) => {
        const result = await executeQuery(
            `DELETE FROM INSTITUTION WHERE INSTITUTION_ID = :id`, { id }
        );
        return result.rowsAffected;
    },
};

module.exports = InstitutionModel;
