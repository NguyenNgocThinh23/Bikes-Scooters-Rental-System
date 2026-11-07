const { query } = require('../config/db');

async function getMyNotifications(req, res, next) {
    try {
        const userId = req.user.id;
        const notifications = await query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50',
            [userId]
        );

        const [unreadRow] = await query(
            'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );

        res.json({
            success: true,
            unread_count: parseInt(unreadRow.unread_count, 10) || 0,
            data: notifications
        });
    } catch (err) {
        next(err);
    }
}

async function markAsRead(req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);
        await query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [id, req.user.id]);
        res.json({ success: true, message: 'Notification marked as read.' });
    } catch (err) {
        next(err);
    }
}

async function markAllAsRead(req, res, next) {
    try {
        await query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.user.id]);
        res.json({ success: true, message: 'All notifications marked as read.' });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getMyNotifications,
    markAsRead,
    markAllAsRead
};
