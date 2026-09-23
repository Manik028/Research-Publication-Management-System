const { executeQuery } = require('../config/db');

const REVIEW_SELECT = `
    SELECT r.REVIEW_ID   AS ID,
           r.PUBLICATION_ID,
           p.TITLE       AS PUBLICATION_TITLE,
           r.SCORE,
           r.ORIGINALITY,
           r.OVERALL_RECOMMENDATION,
           r.COMMENTS_AUTHOR,
           r.COMMENTS_EDITOR,
           r.DEADLINE,
           r.STATUS,
           r.REVIEWER_ID,
           u.FULL_NAME   AS REVIEWER_NAME
    FROM REVIEW r
    JOIN PUBLICATION p ON r.PUBLICATION_ID = p.PUBLICATION_ID
    JOIN "USER" u ON r.REVIEWER_ID = u.USER_ID
`;

const ReviewModel = {
    getReviewsByReviewer: async (reviewerId) => {
        const result = await executeQuery(
            `${REVIEW_SELECT} WHERE r.REVIEWER_ID = :reviewerId ORDER BY r.DEADLINE ASC`,
            { reviewerId }
        );
        return result.rows;
    },

    getAllReviews: async () => {
        const result = await executeQuery(`${REVIEW_SELECT} ORDER BY r.DEADLINE ASC`);
        return result.rows;
    },

    getReviewById: async (reviewId) => {
        const result = await executeQuery(
            `${REVIEW_SELECT} WHERE r.REVIEW_ID = :reviewId`,
            { reviewId }
        );
        return result.rows[0];
    },

    // Calls the ASSIGN_REVIEWER procedure (database/transactions.sql) instead
    // of a raw INSERT — Oracle now validates that the publication and
    // reviewer both exist, the reviewer isn't one of the paper's own
    // authors, the deadline is in the future, there's no duplicate
    // assignment, and the 3-reviewer cap isn't exceeded (with row locking
    // to close the race condition two near-simultaneous calls could hit).
    // Any violation raises a custom ORA-2000x error, which the controller
    // translates into a clean 400 response.
    createReview: async (publicationId, reviewerId, deadline) => {
        await executeQuery(
            `BEGIN ASSIGN_REVIEWER(:publicationId, :reviewerId, TO_DATE(:deadline, 'YYYY-MM-DD')); END;`,
            { publicationId, reviewerId, deadline }
        );
    },

    // Calls SUBMIT_REVIEW (database/procedures_functions.sql) instead of a
    // raw UPDATE — Oracle now re-validates ownership and status itself
    // (defense in depth: even if a future code path bypasses the
    // controller's own checks below, the database still won't allow it).
    submitReview: async (reviewId, reviewerId, score, originality, recommendation, authorComments, editorComments) => {
        await executeQuery(
            `BEGIN SUBMIT_REVIEW(:reviewId, :reviewerId, :score, :originality, :recommendation, :authorComments, :editorComments); END;`,
            {
                reviewId,
                reviewerId,
                score,
                originality,
                recommendation: recommendation || null,
                authorComments: authorComments || null,
                editorComments: editorComments || null,
            }
        );
    },
};

module.exports = ReviewModel;

