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

    createReview: async (publicationId, reviewerId, deadline) => {
        const sql = `
            INSERT INTO REVIEW (PUBLICATION_ID, REVIEWER_ID, DEADLINE, STATUS)
            VALUES (:publicationId, :reviewerId, TO_DATE(:deadline, 'YYYY-MM-DD'), 'Pending')
        `;
        const result = await executeQuery(sql, { publicationId, reviewerId, deadline });
        return result.rowsAffected;
    },

    submitReview: async (reviewId, score, originality, recommendation, authorComments, editorComments) => {
        const sql = `
            UPDATE REVIEW
            SET SCORE                  = :score,
                ORIGINALITY            = :originality,
                OVERALL_RECOMMENDATION = :recommendation,
                COMMENTS_AUTHOR        = :authorComments,
                COMMENTS_EDITOR        = :editorComments,
                STATUS                 = 'Completed'
            WHERE REVIEW_ID = :reviewId
        `;
        const result = await executeQuery(sql, {
            score,
            originality,
            recommendation: recommendation || null,
            authorComments: authorComments || null,
            editorComments: editorComments || null,
            reviewId,
        });
        return result.rowsAffected;
    },
};

module.exports = ReviewModel;
