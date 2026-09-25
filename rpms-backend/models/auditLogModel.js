const { executeQuery } = require('../config/db');

/**
 * Backs the Admin-only Audit Log page. Reads AUDIT_LOG (populated
 * automatically by the 5 audit triggers from database/audit_log.sql —
 * this model never writes to it, only reads).
 */
const AuditLogModel = {
    getPage: async ({ tableName, actionType, page = 1, pageSize = 25 }) => {
        const offset = (Math.max(1, page) - 1) * pageSize;

        const conditions = [];
        const binds = { offset, pageSize };

        if (tableName) {
            conditions.push('TABLE_NAME = :tableName');
            binds.tableName = tableName;
        }
        if (actionType) {
            conditions.push('ACTION_TYPE = :actionType');
            binds.actionType = actionType;
        }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const rowsResult = await executeQuery(
            `SELECT AUDIT_ID, TABLE_NAME, RECORD_ID, ACTION_TYPE, OLD_VALUE,
                    NEW_VALUE, CHANGED_BY, ACTION_TIMESTAMP
             FROM AUDIT_LOG
             ${where}
             ORDER BY AUDIT_ID DESC
             OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`,
            binds
        );

        // Count query only binds the params actually present in `where` —
        // Oracle rejects extra, unreferenced bind variables.
        const countBinds = {};
        if (tableName) countBinds.tableName = tableName;
        if (actionType) countBinds.actionType = actionType;

        const countResult = await executeQuery(
            `SELECT COUNT(*) AS TOTAL FROM AUDIT_LOG ${where}`,
            countBinds
        );

        return {
            rows: rowsResult.rows,
            total: countResult.rows[0].TOTAL,
            page,
            pageSize,
        };
    },

    // Populates the filter dropdowns from real data rather than a
    // hardcoded list, so it never drifts out of sync with what's
    // actually being audited.
    getDistinctTables: async () => {
        const result = await executeQuery(
            `SELECT DISTINCT TABLE_NAME FROM AUDIT_LOG ORDER BY TABLE_NAME`
        );
        return result.rows.map((r) => r.TABLE_NAME);
    },
};

module.exports = AuditLogModel;
