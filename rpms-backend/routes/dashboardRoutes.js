const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/dashboard - any authenticated user (all roles see the same
// aggregate stats). One query via V_DASHBOARD_SUMMARY.
router.get('/', verifyToken, DashboardController.getSummary);

module.exports = router;
