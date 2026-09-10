const express = require('express');
const router = express.Router();
const {
    getResearchAreas,
    addResearchArea,
    deleteResearchArea,
} = require('../controllers/researchAreaController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// GET /api/research-areas
router.get('/', verifyToken, getResearchAreas);

// POST /api/research-areas - Admin or Manager only
router.post('/', verifyToken, authorizeRole('Admin', 'Manager'), addResearchArea);

// DELETE /api/research-areas/:id - Admin only
router.delete('/:id', verifyToken, authorizeRole('Admin'), deleteResearchArea);

module.exports = router;
