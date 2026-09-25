const { executeQuery } = require('../config/db');

/**
 * Thin read-only wrapper around the 7 views from database/views.sql.
 * Every method is one query against a view — no logic lives here, the
 * database already did the work (joins, aggregation) when the view was
 * defined. This is exactly "database should drive the application":
 * these endpoints exist so the SQL objects are actually reachable from
 * the running app, not just demonstrable in SQL Developer.
 */
const ReportsModel = {
    researcherStatistics: async () => {
        const result = await executeQuery(
            `SELECT * FROM V_RESEARCHER_STATISTICS ORDER BY PUBLICATION_COUNT DESC`
        );
        return result.rows;
    },

    projectFunding: async () => {
        const result = await executeQuery(
            `SELECT * FROM V_PROJECT_FUNDING ORDER BY TOTAL_FUNDING DESC`
        );
        return result.rows;
    },

    institutionStatistics: async () => {
        const result = await executeQuery(
            `SELECT * FROM V_INSTITUTION_STATISTICS ORDER BY PUBLICATION_COUNT DESC`
        );
        return result.rows;
    },

    researchAreaStatistics: async () => {
        const result = await executeQuery(
            `SELECT * FROM V_RESEARCH_AREA_STATISTICS ORDER BY PUBLICATION_COUNT DESC`
        );
        return result.rows;
    },

    reviewStatistics: async () => {
        const result = await executeQuery(
            `SELECT * FROM V_REVIEW_STATISTICS ORDER BY TOTAL_ASSIGNED DESC`
        );
        return result.rows;
    },

    publicationDetails: async () => {
        const result = await executeQuery(
            `SELECT * FROM V_PUBLICATION_DETAILS ORDER BY PUBLICATION_ID DESC`
        );
        return result.rows;
    },

    dashboardSummary: async () => {
        const result = await executeQuery(`SELECT * FROM V_DASHBOARD_SUMMARY`);
        return result.rows[0];
    },
};

module.exports = ReportsModel;
