const express = require('express');
const router = express.Router();
const { getMyReviews, submitReview, assignReview } = require('../controllers/reviewController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// GET /api/reviews
router.get('/', verifyToken, getMyReviews);

// POST /api/reviews - assign a reviewer (editorial action)
router.post('/', verifyToken, authorizeRole('Admin', 'Manager'), assignReview);

// PUT /api/reviews/:id/submit
router.put('/:id/submit', verifyToken, submitReview);

module.exports = router;
