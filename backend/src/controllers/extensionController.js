const { query, withTransaction } = require('../config/db');
const { checkVehicleAvailability, checkAvailabilityInTransaction } = require('../services/bookingAvailabilityService');
const { createNotification, notifyAdmins } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');

/**
 * Customer: Request extension for an active rental
 */
async function requestExtension(req, res, next) {
    try {
        const { booking_id, requested_return_datetime } = req.body;
        if (!booking_id || !requested_return_datetime) {
            return res.status(400).json({ success: false, message: 'Booking ID and requested new return time are required.' });
        }

        const bookings = await query('SELECT b.*, v.hourly_rate, v.daily_rate FROM bookings b JOIN vehicles v ON b.vehicle_id = v.id WHERE b.id = ?', [booking_id]);
        if (bookings.length === 0) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        const booking = bookings[0];
        if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        if (booking.booking_status !== 'active') {
            return res.status(400).json({ success: false, message: `Extensions can only be requested for active rentals. Current status: ${booking.booking_status}` });
        }

        const currentReturn = new Date(booking.return_datetime);
        const newReturn = new Date(requested_return_datetime);

        if (isNaN(newReturn.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid return datetime format.' });
        }

        if (newReturn <= currentReturn) {
            return res.status(400).json({ success: false, message: 'Requested return time must be later than the current scheduled return time.' });
        }

        // Check availability for the extended interval EXCLUDING current booking
        const avail = await checkVehicleAvailability(booking.vehicle_id, currentReturn, newReturn, booking.id);
        if (!avail.available) {
            return res.status(409).json({
                success: false,
                message: `Extension conflict: ${avail.reason}`
            });
        }

        // Calculate extension fee
        const extMs = newReturn.getTime() - currentReturn.getTime();
        const extHours = Math.max(1, Math.ceil(extMs / (1000 * 60 * 60)));
        const extDays = Math.ceil(extHours / 24);

        let additionalFee = 0;
        if (extHours < 24) {
            additionalFee = Math.min(extHours * parseFloat(booking.hourly_rate), parseFloat(booking.daily_rate));
        } else {
            additionalFee = extDays * parseFloat(booking.daily_rate);
        }

        // Insert extension request
        const result = await query(`
            INSERT INTO booking_extensions (
                booking_id, user_id, current_return_datetime, requested_return_datetime,
                extension_hours, additional_rental_fee, status
            ) VALUES (?, ?, ?, ?, ?, ?, 'pending')
        `, [booking.id, req.user.id, currentReturn, newReturn, extHours, additionalFee]);

        const extId = result.insertId;

        await notifyAdmins({
            title: 'Extension Request Submitted',
            message: `Customer requested +${extHours}h extension for active rental ${booking.booking_code}.`,
            type: 'extension',
            linkUrl: `/admin/extensions`
        });

        await logAudit({
            userId: req.user.id,
            action: 'EXTENSION_REQUEST',
            entityType: 'BOOKING_EXTENSIONS',
            entityId: extId,
            details: { booking_code: booking.booking_code, extHours, additionalFee },
            ipAddress: req.ip
        });

        res.status(201).json({
            success: true,
            message: 'Extension request submitted successfully. Awaiting administrator approval.',
            data: {
                id: extId,
                extension_hours: extHours,
                additional_rental_fee: additionalFee,
                requested_return_datetime: newReturn
            }
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Admin: Approve extension with transactional re-check
 */
async function approveExtension(req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);
        const { admin_notes } = req.body;

        const extensions = await query(`
            SELECT e.*, b.booking_code, b.vehicle_id, b.user_id as customer_id
            FROM booking_extensions e
            JOIN bookings b ON e.booking_id = b.id
            WHERE e.id = ?
        `, [id]);

        if (extensions.length === 0) {
            return res.status(404).json({ success: false, message: 'Extension request not found.' });
        }

        const ext = extensions[0];
        if (ext.status !== 'pending') {
            return res.status(400).json({ success: false, message: `Extension already processed (${ext.status}).` });
        }

        // TRANSACTIONAL RE-CHECK & UPDATE
        await withTransaction(async (conn) => {
            // Re-verify availability inside transaction with lock, EXCLUDING current booking
            const avail = await checkAvailabilityInTransaction(
                conn,
                ext.vehicle_id,
                ext.current_return_datetime,
                ext.requested_return_datetime,
                ext.booking_id
            );

            if (!avail.available) {
                const err = new Error(`Cannot approve extension: ${avail.reason}`);
                err.statusCode = 409;
                throw err;
            }

            // Update extension status
            await conn.query(
                `UPDATE booking_extensions SET status = 'approved', admin_notes = ?, reviewed_at = NOW() WHERE id = ?`,
                [admin_notes || 'Approved by admin', id]
            );

            // Update booking return datetime and totals
            await conn.query(`
                UPDATE bookings SET
                    return_datetime = ?,
                    duration_hours = duration_hours + ?,
                    extension_fee = extension_fee + ?,
                    total_amount = total_amount + ?
                WHERE id = ?
            `, [ext.requested_return_datetime, ext.extension_hours, ext.additional_rental_fee, ext.additional_rental_fee, ext.booking_id]);
        });

        await createNotification({
            userId: ext.customer_id,
            title: 'Extension Approved!',
            message: `Your extension request for booking ${ext.booking_code} was approved. New return time: ${new Date(ext.requested_return_datetime).toLocaleString()}.`,
            type: 'extension',
            linkUrl: `/customer/active-rentals`
        });

        await logAudit({
            userId: req.user.id,
            action: 'EXTENSION_APPROVE',
            entityType: 'BOOKING_EXTENSIONS',
            entityId: id,
            details: { booking_id: ext.booking_id, new_return: ext.requested_return_datetime },
            ipAddress: req.ip
        });

        res.json({ success: true, message: 'Extension approved and booking schedule updated successfully.' });
    } catch (err) {
        next(err);
    }
}

/**
 * Admin: Reject extension
 */
async function rejectExtension(req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);
        const { admin_notes } = req.body;

        const extensions = await query(`
            SELECT e.*, b.booking_code, b.user_id as customer_id
            FROM booking_extensions e
            JOIN bookings b ON e.booking_id = b.id
            WHERE e.id = ?
        `, [id]);

        if (extensions.length === 0) {
            return res.status(404).json({ success: false, message: 'Extension request not found.' });
        }

        const ext = extensions[0];
        if (ext.status !== 'pending') {
            return res.status(400).json({ success: false, message: `Extension already processed (${ext.status}).` });
        }

        await query(
            `UPDATE booking_extensions SET status = 'rejected', admin_notes = ?, reviewed_at = NOW() WHERE id = ?`,
            [admin_notes || 'Extension declined by administrator', id]
        );

        await createNotification({
            userId: ext.customer_id,
            title: 'Extension Request Declined',
            message: `Your extension request for booking ${ext.booking_code} could not be approved. Reason: ${admin_notes || 'Vehicle scheduled for another reservation'}.`,
            type: 'extension',
            linkUrl: `/customer/active-rentals`
        });

        await logAudit({
            userId: req.user.id,
            action: 'EXTENSION_REJECT',
            entityType: 'BOOKING_EXTENSIONS',
            entityId: id,
            details: { booking_id: ext.booking_id, admin_notes },
            ipAddress: req.ip
        });

        res.json({ success: true, message: 'Extension request rejected.' });
    } catch (err) {
        next(err);
    }
}

/**
 * Admin: Get all extension requests
 */
async function getAllExtensions(req, res, next) {
    try {
        const { status } = req.query;
        let sql = `
            SELECT e.*,
                   b.booking_code, b.pickup_datetime,
                   u.full_name as customer_name, u.email as customer_email,
                   v.name as vehicle_name, v.license_plate
            FROM booking_extensions e
            JOIN bookings b ON e.booking_id = b.id
            JOIN users u ON e.user_id = u.id
            JOIN vehicles v ON b.vehicle_id = v.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            sql += ' AND e.status = ?';
            params.push(status);
        }

        sql += ' ORDER BY e.id DESC';

        const extensions = await query(sql, params);
        res.json({ success: true, count: extensions.length, data: extensions });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    requestExtension,
    approveExtension,
    rejectExtension,
    getAllExtensions
};
