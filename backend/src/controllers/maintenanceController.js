const { query, withTransaction } = require('../config/db');
const { logAudit } = require('../services/auditService');

async function getMaintenanceLogs(req, res, next) {
    try {
        const { status, vehicle_id } = req.query;

        let sql = `
            SELECT m.*, v.name as vehicle_name, v.brand as vehicle_brand, v.license_plate, v.image_url as vehicle_image
            FROM vehicle_maintenance m
            JOIN vehicles v ON m.vehicle_id = v.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            sql += ' AND m.status = ?';
            params.push(status);
        }

        if (vehicle_id) {
            sql += ' AND m.vehicle_id = ?';
            params.push(parseInt(vehicle_id, 10));
        }

        sql += ' ORDER BY m.id DESC';

        const logs = await query(sql, params);
        res.json({ success: true, count: logs.length, data: logs });
    } catch (err) {
        next(err);
    }
}

async function scheduleMaintenance(req, res, next) {
    try {
        const {
            vehicle_id,
            maintenance_type,
            scheduled_date,
            cost = 0,
            description,
            performed_by,
            notes,
            set_vehicle_maintenance_status = true
        } = req.body;

        if (!vehicle_id || !maintenance_type || !scheduled_date) {
            return res.status(400).json({ success: false, message: 'Vehicle ID, maintenance type, and scheduled date are required.' });
        }

        const result = await withTransaction(async (conn) => {
            const [insert] = await conn.query(`
                INSERT INTO vehicle_maintenance (
                    vehicle_id, maintenance_type, scheduled_date, cost,
                    status, description, performed_by, notes
                ) VALUES (?, ?, ?, ?, 'scheduled', ?, ?, ?)
            `, [
                vehicle_id,
                maintenance_type.trim(),
                scheduled_date,
                parseFloat(cost) || 0,
                description || null,
                performed_by || null,
                notes || null
            ]);

            if (set_vehicle_maintenance_status) {
                await conn.query("UPDATE vehicles SET status = 'maintenance' WHERE id = ?", [vehicle_id]);
            }

            return insert.insertId;
        });

        await logAudit({
            userId: req.user.id,
            action: 'MAINTENANCE_SCHEDULE',
            entityType: 'VEHICLE_MAINTENANCE',
            entityId: result,
            details: { vehicle_id, maintenance_type, scheduled_date },
            ipAddress: req.ip
        });

        res.status(201).json({ success: true, message: 'Maintenance scheduled successfully.', id: result });
    } catch (err) {
        next(err);
    }
}

async function completeMaintenance(req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);
        const { completed_date, cost, notes, set_vehicle_available = true } = req.body;

        const logs = await query('SELECT * FROM vehicle_maintenance WHERE id = ?', [id]);
        if (logs.length === 0) {
            return res.status(404).json({ success: false, message: 'Maintenance log not found.' });
        }

        const log = logs[0];
        const compDate = completed_date || new Date().toISOString().slice(0, 10);

        await withTransaction(async (conn) => {
            await conn.query(`
                UPDATE vehicle_maintenance SET
                    status = 'completed',
                    completed_date = ?,
                    cost = COALESCE(?, cost),
                    notes = CONCAT(COALESCE(notes, ''), '\n[Completion Note]: ', ?)
                WHERE id = ?
            `, [compDate, cost ? parseFloat(cost) : null, notes || 'Maintenance successfully completed', id]);

            if (set_vehicle_available) {
                await conn.query("UPDATE vehicles SET status = 'available', vehicle_condition = 'excellent' WHERE id = ?", [log.vehicle_id]);
            }
        });

        await logAudit({
            userId: req.user.id,
            action: 'MAINTENANCE_COMPLETE',
            entityType: 'VEHICLE_MAINTENANCE',
            entityId: id,
            details: { vehicle_id: log.vehicle_id, compDate },
            ipAddress: req.ip
        });

        res.json({ success: true, message: 'Maintenance completed and vehicle restored to Available status.' });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getMaintenanceLogs,
    scheduleMaintenance,
    completeMaintenance
};
