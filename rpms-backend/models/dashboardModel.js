const { executeQuery } = require('../config/db');

/**
 * Backed by V_DASHBOARD_SUMMARY (database/views.sql, Block 9) — one Oracle
 * query returns every dashboard number, instead of the old approach of
 * fetching entire PUBLICATION/PROJECT/USER/FILE tables to the frontend
 * just to read their .length.
 */
const DashboardModel = {
    getSummary: async () => {
        const result = await executeQuery(`SELECT * FROM V_DASHBOARD_SUMMARY`);
        return result.rows[0];
    },
};

module.exports = DashboardModel;
