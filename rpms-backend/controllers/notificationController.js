const NotificationModel = require('../models/notificationModel');

const getNotifications = async (req, res) => {
    try {
        const data = await NotificationModel.getByUser(req.user.id);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const addNotification = async (req, res) => {
    try {
        const body = req.body || {};
        const message = body.MESSAGE ?? body.message;
        const category = body.CATEGORY ?? body.category;
        // Only an Admin may raise a notification for someone else.
        const targetUserId = req.user.role === 'Admin' && (body.USER_ID ?? body.userId)
            ? Number(body.USER_ID ?? body.userId)
            : req.user.id;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        const newId = await NotificationModel.create({ category, message, userId: targetUserId });
        const created = await NotificationModel.getById(newId);

        return res.status(201).json({ success: true, message: 'Notification created', data: created });
    } catch (error) {
        console.error('Error creating notification:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const markAsRead = async (req, res) => {
    try {
        const notification = await NotificationModel.getById(Number(req.params.id));
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        if (Number(notification.USER_ID) !== Number(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: '403 Forbidden: This notification does not belong to you.',
            });
        }

        await NotificationModel.markAsRead(Number(req.params.id));
        return res.status(200).json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error updating notification:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { getNotifications, addNotification, markAsRead };
