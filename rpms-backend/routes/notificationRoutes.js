const express = require('express');
const router = express.Router();
const {
    getNotifications,
    addNotification,
    markAsRead,
} = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/notifications - the caller's notifications
router.get('/', verifyToken, getNotifications);

// POST /api/notifications
router.post('/', verifyToken, addNotification);

// PUT /api/notifications/:id/read
router.put('/:id/read', verifyToken, markAsRead);

module.exports = router;
