const express = require('express');
const router = express.Router();
const {
    getResearchAreas,
    addResearchArea,
    deleteResearchArea,
} = require('../controllers/researchAreaController');
const { verifyToken, optionalAuth, authorizeRole } = require('../middleware/authMiddleware');

// GET /api/research-areas - public reference data (Institutions/Venues are
// already public the same way). Needed by the anonymous-visible Publications
// filter panel, not just the logged-in dashboard's Research Areas page.
router.get('/', optionalAuth, getResearchAreas);

// POST /api/research-areas - Admin or Manager only
router.post('/', verifyToken, authorizeRole('Admin', 'Manager'), addResearchArea);

// DELETE /api/research-areas/:id - Admin only
router.delete('/:id', verifyToken, authorizeRole('Admin'), deleteResearchArea);

module.exports = router;
