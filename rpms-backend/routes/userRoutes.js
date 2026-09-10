const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateUser } = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/users
router.get('/', verifyToken, getUsers);

// GET /api/users/:id
router.get('/:id', verifyToken, getUserById);

// PUT /api/users/:id - self-service (Admins may edit anyone)
router.put('/:id', verifyToken, updateUser);

module.exports = router;
