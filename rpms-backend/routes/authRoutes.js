const express = require('express');
const router = express.Router();
const { register, login, me } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me - current session user, straight from the database
router.get('/me', verifyToken, me);

module.exports = router;
