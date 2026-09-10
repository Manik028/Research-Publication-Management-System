const express = require('express');
const router = express.Router();
const {
    getInstitutions,
    addInstitution,
    deleteInstitution,
} = require('../controllers/institutionController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// GET /api/institutions
router.get('/', verifyToken, getInstitutions);

// POST /api/institutions - Admin or Manager only
router.post('/', verifyToken, authorizeRole('Admin', 'Manager'), addInstitution);

// DELETE /api/institutions/:id - Admin only
router.delete('/:id', verifyToken, authorizeRole('Admin'), deleteInstitution);

module.exports = router;
