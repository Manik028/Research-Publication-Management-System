const AuditLogModel = require('../models/auditLogModel');

const getAuditLog = async (req, res) => {
    try {
        const { table, action, page } = req.query;
        const pageNum = Number(page) || 1;

        const result = await AuditLogModel.getPage({
            tableName: table || null,
            actionType: action || null,
            page: pageNum,
            pageSize: 25,
        });

        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('Error fetching audit log:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getAuditLogTables = async (req, res) => {
    try {
        const tables = await AuditLogModel.getDistinctTables();
        return res.status(200).json({ success: true, data: tables });
    } catch (error) {
        console.error('Error fetching audit log tables:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { getAuditLog, getAuditLogTables };
