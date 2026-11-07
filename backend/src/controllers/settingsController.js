const { query } = require('../config/db');
const { logAudit } = require('../services/auditService');

async function getSettings(req, res, next) {
    try {
        const settings = await query('SELECT * FROM system_settings ORDER BY id ASC');
        const settingsMap = {};
        for (const s of settings) {
            settingsMap[s.setting_key] = s.setting_value;
        }
        res.json({ success: true, settings, map: settingsMap });
    } catch (err) {
        next(err);
    }
}

async function updateSetting(req, res, next) {
    try {
        const { key } = req.params;
        const { value } = req.body;

        if (value === undefined) {
            return res.status(400).json({ success: false, message: 'Setting value is required.' });
        }

        await query('UPDATE system_settings SET setting_value = ? WHERE setting_key = ?', [String(value), key]);

        await logAudit({
            userId: req.user.id,
            action: 'SETTING_UPDATE',
            entityType: 'SYSTEM_SETTINGS',
            entityId: key,
            details: { key, new_value: value },
            ipAddress: req.ip
        });

        res.json({ success: true, message: `Setting ${key} updated successfully.` });
    } catch (err) {
        next(err);
    }
}

async function getAuditLogs(req, res, next) {
    try {
        const { action, entity_type } = req.query;

        let sql = `
            SELECT a.*, u.full_name as user_name, u.email as user_email, u.role as user_role
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (action) {
            sql += ' AND a.action = ?';
            params.push(action);
        }

        if (entity_type) {
            sql += ' AND a.entity_type = ?';
            params.push(entity_type);
        }

        sql += ' ORDER BY a.id DESC LIMIT 100';

        const logs = await query(sql, params);
        res.json({ success: true, count: logs.length, data: logs });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getSettings,
    updateSetting,
    getAuditLogs
};
