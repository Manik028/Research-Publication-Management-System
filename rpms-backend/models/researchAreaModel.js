const { executeQuery, insertReturningId } = require('../config/db');

const AREA_SELECT = `
    SELECT AREA_ID AS ID, AREA_NAME, DESCRIPTION
    FROM RESEARCH_AREA
`;

const ResearchAreaModel = {
    getAll: async () => {
        const result = await executeQuery(`${AREA_SELECT} ORDER BY AREA_NAME`);
        return result.rows;
    },

    getById: async (id) => {
        const result = await executeQuery(`${AREA_SELECT} WHERE AREA_ID = :id`, { id });
        return result.rows[0];
    },

    create: async ({ areaName, description }) => {
        const sql = `
            INSERT INTO RESEARCH_AREA (AREA_NAME, DESCRIPTION)
            VALUES (:areaName, :description)
            RETURNING AREA_ID INTO :newId
        `;
        return insertReturningId(sql, { areaName, description: description || null });
    },

    remove: async (id) => {
        const result = await executeQuery(`DELETE FROM RESEARCH_AREA WHERE AREA_ID = :id`, { id });
        return result.rowsAffected;
    },
};

module.exports = ResearchAreaModel;
