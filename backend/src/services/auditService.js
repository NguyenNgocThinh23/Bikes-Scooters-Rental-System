const { query } = require('../config/db');

async function logAudit({ userId = null, action, entityType, entityId = null, details = {}, ipAddress = null }) {
    try {
        const sql = `
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await query(sql, [
            userId,
            action,
            entityType,
            entityId ? String(entityId) : null,
            JSON.stringify(details),
            ipAddress
        ]);
    } catch (err) {
        console.error('Failed to write audit log:', err);
    }
}

module.exports = {
    logAudit
};
