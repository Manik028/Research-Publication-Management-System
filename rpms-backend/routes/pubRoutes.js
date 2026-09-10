const express = require('express');
const router = express.Router();
const {
    getPublications,
    getPublication,
    addPublication,
    deletePublication,
} = require('../controllers/pubController');
const { verifyToken, optionalAuth } = require('../middleware/authMiddleware');

// GET /api/publications - public browsing (the Home/Publications pages are
// reachable without logging in), but a token still enables ?mine=true.
router.get('/', optionalAuth, getPublications);

// GET /api/publications/:id
router.get('/:id', optionalAuth, getPublication);

// POST /api/publications
router.post('/', verifyToken, addPublication);

// DELETE /api/publications/:id - ownership verified in the controller
router.delete('/:id', verifyToken, deletePublication);

module.exports = router;
