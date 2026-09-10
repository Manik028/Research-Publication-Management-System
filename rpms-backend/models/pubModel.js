const { executeQuery, insertReturningId } = require('../config/db');

const PUB_SELECT = `
    SELECT p.PUBLICATION_ID     AS ID,
           p.TITLE,
           p.ABSTRACT,
           p.DOI,
           p.SUBMISSION_DATE,
           p.TOTAL_VIEWS,
           p.TOTAL_DOWNLOADS,
           p.CONFIRMATION_STATUS,
           p.VENUE_ID,
           v.NAME               AS VENUE_NAME,
           p.USER_ID,
           u.FULL_NAME          AS AUTHOR
    FROM PUBLICATION p
    JOIN "USER" u ON p.USER_ID = u.USER_ID
    LEFT JOIN VENUE v ON p.VENUE_ID = v.VENUE_ID
`;

const PubModel = {
    getAllPublications: async () => {
        const result = await executeQuery(
            `${PUB_SELECT} ORDER BY p.SUBMISSION_DATE DESC, p.PUBLICATION_ID DESC`
        );
        return result.rows;
    },

    getPublicationsByUser: async (userId) => {
        const result = await executeQuery(
            `${PUB_SELECT} WHERE p.USER_ID = :userId ORDER BY p.PUBLICATION_ID DESC`,
            { userId }
        );
        return result.rows;
    },

    // Full joined row (used after create, and by the frontend list)
    getPublicationById: async (pubId) => {
        const result = await executeQuery(
            `${PUB_SELECT} WHERE p.PUBLICATION_ID = :pubId`,
            { pubId }
        );
        return result.rows[0];
    },

    createPublication: async (title, abstract, doi, userId, venueId = null) => {
        const sql = `
            INSERT INTO PUBLICATION (TITLE, ABSTRACT, DOI, VENUE_ID, USER_ID)
            VALUES (:title, :abstract, :doi, :venueId, :userId)
            RETURNING PUBLICATION_ID INTO :newId
        `;
        return insertReturningId(sql, {
            title,
            abstract: abstract || null,
            doi: doi || null,
            venueId: venueId || null,
            userId,
        });
    },

    deletePublication: async (pubId) => {
        const result = await executeQuery(
            `DELETE FROM PUBLICATION WHERE PUBLICATION_ID = :pubId`,
            { pubId }
        );
        return result.rowsAffected;
    },
};

module.exports = PubModel;
