const { query } = require('../config/db');

async function createNotification({ userId, title, message, type = 'system', linkUrl = null }) {
    try {
        const sql = `
            INSERT INTO notifications (user_id, title, message, type, is_read, link_url)
            VALUES (?, ?, ?, ?, FALSE, ?)
        `;
        await query(sql, [userId, title, message, type, linkUrl]);
    } catch (err) {
        console.error('Failed to create notification:', err);
    }
}

async function notifyAdmins({ title, message, type = 'system', linkUrl = null }) {
    try {
        const admins = await query("SELECT id FROM users WHERE role = 'admin' AND status = 'active'");
        for (const admin of admins) {
            await createNotification({ userId: admin.id, title, message, type, linkUrl });
        }
    } catch (err) {
        console.error('Failed to notify admins:', err);
    }
}

module.exports = {
    createNotification,
    notifyAdmins
};
