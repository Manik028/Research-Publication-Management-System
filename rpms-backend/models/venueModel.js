const { executeQuery, insertReturningId } = require('../config/db');

const VENUE_SELECT = `
    SELECT VENUE_ID AS ID, NAME, TYPE, SUBMISSION_DEADLINE, STATUS
    FROM VENUE
`;

const VenueModel = {
    getAllVenues: async () => {
        const result = await executeQuery(`${VENUE_SELECT} ORDER BY NAME`);
        return result.rows;
    },

    getVenueById: async (id) => {
        const result = await executeQuery(`${VENUE_SELECT} WHERE VENUE_ID = :id`, { id });
        return result.rows[0];
    },

    createVenue: async ({ name, type, submissionDeadline, status }) => {
        // TO_DATE(NULL, ...) is safe in Oracle, but the deadline is optional so
        // the bind is normalised to NULL up-front.
        const sql = `
            INSERT INTO VENUE (NAME, TYPE, SUBMISSION_DEADLINE, STATUS)
            VALUES (:name, :type, TO_DATE(:submissionDeadline, 'YYYY-MM-DD'), :status)
            RETURNING VENUE_ID INTO :newId
        `;
        return insertReturningId(sql, {
            name,
            type,
            submissionDeadline: submissionDeadline || null,
            status: status || 'Open',
        });
    },
};

module.exports = VenueModel;
