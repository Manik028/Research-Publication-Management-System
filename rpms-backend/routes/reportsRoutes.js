const express = require('express');
const router = express.Router();
const {
    getResearcherStatistics,
    getProjectFunding,
    getInstitutionStatistics,
    getResearchAreaStatistics,
    getReviewStatistics,
    getPublicationDetails,
    getDashboardSummary,
} = require('../controllers/reportsController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// All reports are Admin/Manager only — matches the master plan's
// "Admin should have advanced database-driven analytics" / Manager's
// project & funding oversight role.
router.use(verifyToken, authorizeRole('Admin', 'Manager'));

router.get('/researchers', getResearcherStatistics);
router.get('/projects', getProjectFunding);
router.get('/institutions', getInstitutionStatistics);
router.get('/research-areas', getResearchAreaStatistics);
router.get('/reviewers', getReviewStatistics);
router.get('/publications', getPublicationDetails);
router.get('/summary', getDashboardSummary);

module.exports = router;
