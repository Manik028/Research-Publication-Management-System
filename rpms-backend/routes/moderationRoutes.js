const express = require('express');
const router = express.Router();
const { getQueue, flagItem, resolveItem } = require('../controllers/moderationController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// GET /api/moderation - Admin only
router.get('/', verifyToken, authorizeRole('Admin'), getQueue);

// POST /api/moderation - any signed-in user can flag content
router.post('/', verifyToken, flagItem);

// PUT /api/moderation/:id - Admin only
router.put('/:id', verifyToken, authorizeRole('Admin'), resolveItem);

module.exports = router;
