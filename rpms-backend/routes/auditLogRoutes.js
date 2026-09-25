const express = require('express');
const router = express.Router();
const { getAuditLog, getAuditLogTables } = require('../controllers/auditLogController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// GET /api/audit-log?table=PUBLICATION&action=UPDATE&page=1 - Admin only
router.get('/', verifyToken, authorizeRole('Admin'), getAuditLog);

// GET /api/audit-log/tables - distinct table names for the filter dropdown
router.get('/tables', verifyToken, authorizeRole('Admin'), getAuditLogTables);

module.exports = router;
