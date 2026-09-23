const express = require('express');
const router = express.Router();
const {
    getPublications,
    getPublication,
    addPublication,
    deletePublication,
    approvePublication,
    rejectPublication,
} = require('../controllers/pubController');
const { verifyToken, optionalAuth, authorizeRole } = require('../middleware/authMiddleware');

// GET /api/publications - public browsing (the Home/Publications pages are
// reachable without logging in), but a token still enables ?mine=true.
router.get('/', optionalAuth, getPublications);

// GET /api/publications/:id
router.get('/:id', optionalAuth, getPublication);

// POST /api/publications
router.post('/', verifyToken, addPublication);

// DELETE /api/publications/:id - ownership verified in the controller
router.delete('/:id', verifyToken, deletePublication);

// PUT /api/publications/:id/approve | /reject - editorial decisions
// (Admin / Manager only). Oracle itself enforces the status must be
// Under Review or Resubmitted (APPROVE_PUBLICATION / REJECT_PUBLICATION).
router.put('/:id/approve', verifyToken, authorizeRole('Admin', 'Manager'), approvePublication);
router.put('/:id/reject', verifyToken, authorizeRole('Admin', 'Manager'), rejectPublication);

module.exports = router;
