const { executeQuery, oracledb } = require('../config/db');

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

    // Real server-side advanced search/filter — every value here is a bind
    // variable, never concatenated into the SQL text, even the keyword
    // search (built with Oracle's own || concatenation inside the LIKE
    // clause, not JS string interpolation). Demonstrates exactly the kind
    // of filtered, multi-table query advanced_queries.sql already has in
    // static form — this makes the same techniques actually reachable
    // from the running app.
    search: async ({ q, status, venueType, areaId, dateFrom, dateTo }) => {
        const conditions = [];
        const binds = {};

        if (q) {
            conditions.push(
                `(UPPER(p.TITLE) LIKE UPPER('%'||:q||'%') OR UPPER(p.ABSTRACT) LIKE UPPER('%'||:q||'%') OR UPPER(u.FULL_NAME) LIKE UPPER('%'||:q||'%'))`
            );
            binds.q = q;
        }
        if (status) {
            conditions.push(`p.CONFIRMATION_STATUS = :status`);
            binds.status = status;
        }
        if (venueType) {
            conditions.push(`v.TYPE = :venueType`);
            binds.venueType = venueType;
        }
        if (areaId) {
            conditions.push(
                `EXISTS (SELECT 1 FROM PUBLICATION_RESEARCH_AREA pra WHERE pra.PUBLICATION_ID = p.PUBLICATION_ID AND pra.AREA_ID = :areaId)`
            );
            binds.areaId = areaId;
        }
        if (dateFrom) {
            conditions.push(`p.SUBMISSION_DATE >= TO_DATE(:dateFrom, 'YYYY-MM-DD')`);
            binds.dateFrom = dateFrom;
        }
        if (dateTo) {
            conditions.push(`p.SUBMISSION_DATE <= TO_DATE(:dateTo, 'YYYY-MM-DD')`);
            binds.dateTo = dateTo;
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const result = await executeQuery(
            `${PUB_SELECT} ${where} ORDER BY p.SUBMISSION_DATE DESC, p.PUBLICATION_ID DESC`,
            binds
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

    // Powers the Publication Detail page: base row + ordered author list
    // (with AUTHOR_ORDER/IS_CORRESPONDING, not just names) + research
    // areas + file metadata. 4 small queries rather than one giant join,
    // since the base row is 1:1 but authors/areas/files are all 1:N —
    // joining them together would multiply the base row per author.
    getFullDetail: async (pubId) => {
        const base = await executeQuery(`${PUB_SELECT} WHERE p.PUBLICATION_ID = :pubId`, { pubId });
        if (!base.rows[0]) return null;

        const authors = await executeQuery(
            `SELECT ap.USER_ID, u.FULL_NAME, ap.AUTHOR_ROLE, ap.AUTHOR_ORDER, ap.IS_CORRESPONDING
             FROM AUTHOR_PUBLICATION ap JOIN "USER" u ON u.USER_ID = ap.USER_ID
             WHERE ap.PUBLICATION_ID = :pubId
             ORDER BY ap.AUTHOR_ORDER NULLS LAST, u.FULL_NAME`,
            { pubId }
        );

        const areas = await executeQuery(
            `SELECT ra.AREA_ID, ra.AREA_NAME
             FROM PUBLICATION_RESEARCH_AREA pra JOIN RESEARCH_AREA ra ON ra.AREA_ID = pra.AREA_ID
             WHERE pra.PUBLICATION_ID = :pubId
             ORDER BY ra.AREA_NAME`,
            { pubId }
        );

        const files = await executeQuery(
            `SELECT FILE_ID, FILE_NAME, FILE_TYPE, FILE_SIZE, UPLOAD_DATE
             FROM "FILE" WHERE PUBLICATION_ID = :pubId ORDER BY UPLOAD_DATE DESC`,
            { pubId }
        );

        return {
            ...base.rows[0],
            AUTHORS: authors.rows,
            RESEARCH_AREAS: areas.rows,
            FILES: files.rows,
        };
    },

    // Review summaries for the detail page — only meaningful to show to
    // someone authorized to see review status (an author, or Admin/Manager),
    // so the controller decides whether to call this at all.
    getReviewSummary: async (pubId) => {
        const result = await executeQuery(
            `SELECT r.REVIEW_ID, r.STATUS, r.SCORE, r.ORIGINALITY,
                    r.OVERALL_RECOMMENDATION, r.DEADLINE, u.FULL_NAME AS REVIEWER_NAME
             FROM REVIEW r JOIN "USER" u ON u.USER_ID = r.REVIEWER_ID
             WHERE r.PUBLICATION_ID = :pubId
             ORDER BY r.REVIEW_ID`,
            { pubId }
        );
        return result.rows;
    },

    // Calls CREATE_PUBLICATION_FULL (database/transactions.sql) instead of
    // a bare single-table INSERT. This is the fix for a real gap: the old
    // version created a PUBLICATION row but never linked the submitter into
    // AUTHOR_PUBLICATION at all — the M:N authorship table stayed empty for
    // every publication created through the app. The procedure inserts the
    // publication, the author link(s), and any research areas as ONE atomic
    // transaction with an explicit COMMIT/ROLLBACK — exactly the "insert
    // publication, insert authors" pattern this needs.
    //
    // extraAuthorIds/areaIds default to none, matching the current UI (which
    // only collects title/abstract/doi/venue) — the submitter is always
    // author #1 / corresponding author. Passing extra co-author or research
    // area IDs later (once the form supports it) needs no backend change.
    createPublication: async (title, abstract, doi, userId, venueId = null, extraAuthorIds = [], areaIds = []) => {
        const authorIdsCsv = [userId, ...extraAuthorIds].join(',');
        const areaIdsCsv = areaIds.length ? areaIds.join(',') : null;

        const result = await executeQuery(
            `BEGIN
                CREATE_PUBLICATION_FULL(
                    p_title => :title,
                    p_abstract => :abstract,
                    p_doi => :doi,
                    p_venue_id => :venueId,
                    p_owner_user_id => :userId,
                    p_author_ids => :authorIds,
                    p_area_ids => :areaIds,
                    p_new_publication_id => :newId
                );
            END;`,
            {
                title,
                abstract: abstract || null,
                doi: doi || null,
                venueId: venueId || null,
                userId,
                authorIds: authorIdsCsv,
                areaIds: areaIdsCsv,
                newId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
            }
        );

        return result.outBinds.newId;
    },

    deletePublication: async (pubId) => {
        const result = await executeQuery(
            `DELETE FROM PUBLICATION WHERE PUBLICATION_ID = :pubId`,
            { pubId }
        );
        return result.rowsAffected;
    },

    // Calls APPROVE_PUBLICATION / REJECT_PUBLICATION (database/procedures_functions.sql)
    // instead of a raw UPDATE — Oracle enforces the status is currently
    // 'Under Review' or 'Resubmitted' before allowing the transition, and
    // TRG_PUBLICATION_STATUS_GUARD (Block 11) double-checks the transition
    // itself is legal no matter which path triggered the UPDATE.
    approvePublication: async (pubId) => {
        await executeQuery(`BEGIN APPROVE_PUBLICATION(:pubId); END;`, { pubId });
    },

    rejectPublication: async (pubId) => {
        await executeQuery(`BEGIN REJECT_PUBLICATION(:pubId); END;`, { pubId });
    },
};

module.exports = PubModel;

