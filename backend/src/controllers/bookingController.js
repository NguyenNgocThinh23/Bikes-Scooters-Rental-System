const crypto = require('crypto');
const { query, withTransaction } = require('../config/db');
const { checkVehicleAvailability, checkAvailabilityInTransaction } = require('../services/bookingAvailabilityService');
const { calculateRentalPrice } = require('../services/pricingService');
const { createNotification, notifyAdmins } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');

function generateBookingCode() {
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const year = new Date().getFullYear();
    return `RN-${year}-${randomHex}`;
}

/**
 * Customer: Submit new booking request (status -> pending)
 */
async function createBooking(req, res, next) {
    try {
        const userId = req.user.id;
        const {
            vehicle_id,
            pickup_location_id,
            return_location_id,
            pickup_datetime,
            return_datetime,
            notes
        } = req.body;

        if (!vehicle_id || !pickup_location_id || !return_location_id || !pickup_datetime || !return_datetime) {
            return res.status(400).json({ success: false, message: 'All booking fields are required.' });
        }

        const pickupDate = new Date(pickup_datetime);
        const returnDate = new Date(return_datetime);

        if (isNaN(pickupDate.getTime()) || isNaN(returnDate.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid pickup or return date format.' });
        }

        const now = new Date();
        // Allow 5 min leeway for client clock difference
        if (pickupDate.getTime() < now.getTime() - 5 * 60 * 1000) {
            return res.status(400).json({ success: false, message: 'Pickup date cannot be in the past.' });
        }

        if (returnDate <= pickupDate) {
            return res.status(400).json({ success: false, message: 'Return date must be strictly after pickup date.' });
        }

        // 1. Availability check
        const avail = await checkVehicleAvailability(vehicle_id, pickupDate, returnDate);
        if (!avail.available) {
            return res.status(409).json({ success: false, message: avail.reason, conflicts: avail.conflicts });
        }

        // 2. Pricing calculation
        const pricing = await calculateRentalPrice(avail.vehicle, pickupDate, returnDate);
        const bookingCode = generateBookingCode();

        // 3. Insert booking & deposit in transaction
        const result = await withTransaction(async (conn) => {
            const [bookingInsert] = await conn.query(`
                INSERT INTO bookings (
                    booking_code, user_id, vehicle_id, pickup_location_id, return_location_id,
                    pickup_datetime, return_datetime, rental_type, duration_hours,
                    rental_fee, deposit_amount, discount_amount, total_amount,
                    payment_status, booking_status, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?)
            `, [
                bookingCode,
                userId,
                vehicle_id,
                pickup_location_id,
                return_location_id,
                pickupDate,
                returnDate,
                pricing.rentalType,
                pricing.durationHours,
                pricing.rentalFee,
                pricing.depositAmount,
                pricing.discountAmount,
                pricing.totalAmount,
                notes || null
            ]);

            const bookingId = bookingInsert.insertId;

            // Create initial deposit record
            await conn.query(`
                INSERT INTO deposits (booking_id, user_id, amount, status)
                VALUES (?, ?, ?, 'held')
            `, [bookingId, userId, pricing.depositAmount]);

            return { bookingId, bookingCode };
        });

        // 4. Notifications & Auditing
        await createNotification({
            userId,
            title: 'Booking Request Submitted',
            message: `Your booking request ${result.bookingCode} has been submitted and is awaiting administrator confirmation.`,
            type: 'booking',
            linkUrl: `/customer/my-bookings`
        });

        await notifyAdmins({
            title: 'New Booking Request',
            message: `Customer ${req.user.full_name} submitted booking ${result.bookingCode} for vehicle ${avail.vehicle.name}.`,
            type: 'booking',
            linkUrl: `/admin/bookings`
        });

        await logAudit({
            userId,
            action: 'BOOKING_CREATE',
            entityType: 'BOOKINGS',
            entityId: result.bookingId,
            details: { booking_code: result.bookingCode, vehicle_id, total_amount: pricing.totalAmount },
            ipAddress: req.ip
        });

        res.status(201).json({
            success: true,
            message: 'Booking request created successfully. Awaiting admin confirmation.',
            data: {
                booking_id: result.bookingId,
                booking_code: result.bookingCode,
                total_amount: pricing.totalAmount,
                deposit_amount: pricing.depositAmount,
                rental_fee: pricing.rentalFee,
                duration_hours: pricing.durationHours,
                rental_type: pricing.rentalType
            }
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Customer: Get current user's bookings
 */
async function getMyBookings(req, res, next) {
    try {
        const userId = req.user.id;
        const { status, search } = req.query;

        let sql = `
            SELECT b.*,
                   v.name as vehicle_name, v.brand as vehicle_brand, v.model as vehicle_model,
                   v.image_url as vehicle_image, v.license_plate,
                   c.name as category_name,
                   pl.name as pickup_location_name,
                   rl.name as return_location_name,
                   d.status as deposit_status, d.refunded_amount as deposit_refunded
            FROM bookings b
            JOIN vehicles v ON b.vehicle_id = v.id
            JOIN categories c ON v.category_id = c.id
            JOIN locations pl ON b.pickup_location_id = pl.id
            JOIN locations rl ON b.return_location_id = rl.id
            LEFT JOIN deposits d ON d.booking_id = b.id
            WHERE b.user_id = ?
        `;
        const params = [userId];

        if (status) {
            sql += ' AND b.booking_status = ?';
            params.push(status);
        }

        if (search) {
            sql += ' AND (b.booking_code LIKE ? OR v.name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        sql += ' ORDER BY b.id DESC';

        const bookings = await query(sql, params);
        res.json({ success: true, count: bookings.length, data: bookings });
    } catch (err) {
        next(err);
    }
}

/**
 * Get single booking details (Customer owner or Admin)
 */
async function getBookingById(req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);
        const sql = `
            SELECT b.*,
                   u.full_name as customer_name, u.email as customer_email, u.phone as customer_phone,
                   u.document_verification_status,
                   v.name as vehicle_name, v.brand as vehicle_brand, v.model as vehicle_model,
                   v.image_url as vehicle_image, v.license_plate, v.hourly_rate, v.daily_rate,
                   v.status as vehicle_operational_status,
                   c.name as category_name,
                   pl.name as pickup_location_name, pl.address as pickup_location_address,
                   rl.name as return_location_name, rl.address as return_location_address,
                   d.status as deposit_status, d.amount as deposit_original_amount,
                   d.refunded_amount as deposit_refunded, d.deducted_amount as deposit_deducted,
                   d.deduction_reason as deposit_deduction_reason
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN vehicles v ON b.vehicle_id = v.id
            JOIN categories c ON v.category_id = c.id
            JOIN locations pl ON b.pickup_location_id = pl.id
            JOIN locations rl ON b.return_location_id = rl.id
            LEFT JOIN deposits d ON d.booking_id = b.id
            WHERE b.id = ?
        `;
        const bookings = await query(sql, [id]);
        if (bookings.length === 0) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        const booking = bookings[0];

        // Access check
        if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied to this booking.' });
        }

        // Fetch payments
        const payments = await query(
            'SELECT * FROM payments WHERE booking_id = ? ORDER BY id ASC',
            [id]
        );

        // Fetch return inspection if exists
        const returnInspections = await query(
            'SELECT * FROM rental_returns WHERE booking_id = ?',
            [id]
        );

        // Fetch extensions if exists
        const extensions = await query(
            'SELECT * FROM booking_extensions WHERE booking_id = ? ORDER BY id DESC',
            [id]
        );

        // Fetch review if exists
        const reviews = await query(
            'SELECT * FROM reviews WHERE booking_id = ?',
            [id]
        );

        res.json({
            success: true,
            data: {
                ...booking,
                payments,
                return_inspection: returnInspections[0] || null,
                extensions,
                review: reviews[0] || null
            }
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Customer or Admin: Cancel booking
 */
async function cancelBooking(req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);
        const { reason } = req.body;

        const bookings = await query('SELECT * FROM bookings WHERE id = ?', [id]);
        if (bookings.length === 0) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        const booking = bookings[0];

        if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        if (['active', 'completed', 'cancelled', 'rejected'].includes(booking.booking_status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel a booking that is currently ${booking.booking_status}.`
            });
        }

        await withTransaction(async (conn) => {
            await conn.query(
                `UPDATE bookings SET booking_status = 'cancelled', cancellation_reason = ? WHERE id = ?`,
                [reason || 'Cancelled by user', id]
            );

            // If deposit was held, mark for refund
            await conn.query(
                `UPDATE deposits SET status = 'refunded', refunded_amount = amount WHERE booking_id = ? AND status = 'held'`,
                [id]
            );
        });

        await createNotification({
            userId: booking.user_id,
            title: 'Booking Cancelled',
            message: `Booking ${booking.booking_code} has been cancelled.`,
            type: 'booking',
            linkUrl: `/customer/my-bookings`
        });

        await logAudit({
            userId: req.user.id,
            action: 'BOOKING_CANCEL',
            entityType: 'BOOKINGS',
            entityId: id,
            details: { booking_code: booking.booking_code, reason },
            ipAddress: req.ip
        });

        res.json({ success: true, message: 'Booking cancelled successfully.' });
    } catch (err) {
        next(err);
    }
}

/**
 * Admin: Confirm booking with strict transactional anti-double-booking check
 */
async function confirmBooking(req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);

        const bookings = await query('SELECT * FROM bookings WHERE id = ?', [id]);
        if (bookings.length === 0) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        const booking = bookings[0];
        if (booking.booking_status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Only pending bookings can be confirmed. Current status: ${booking.booking_status}`
            });
        }

        // TRANSACTIONAL RE-CHECK & UPDATE
        await withTransaction(async (conn) => {
            // Re-verify availability inside transaction with row-level locks
            const avail = await checkAvailabilityInTransaction(
                conn,
                booking.vehicle_id,
                booking.pickup_datetime,
                booking.return_datetime,
                booking.id
            );

            if (!avail.available) {
                const conflictError = new Error(avail.reason || 'Vehicle is no longer available due to a conflicting confirmed reservation.');
                conflictError.statusCode = 409;
                throw conflictError;
            }

            // Update booking status to confirmed
            await conn.query(
                `UPDATE bookings SET booking_status = 'confirmed' WHERE id = ?`,
                [id]
            );
        });

        await createNotification({
            userId: booking.user_id,
            title: 'Booking Confirmed!',
            message: `Your booking ${booking.booking_code} has been confirmed by the administrator.`,
            type: 'booking',
            linkUrl: `/customer/my-bookings`
        });

        await logAudit({
            userId: req.user.id,
            action: 'BOOKING_CONFIRM',
            entityType: 'BOOKINGS',
            entityId: id,
            details: { booking_code: booking.booking_code, vehicle_id: booking.vehicle_id },
            ipAddress: req.ip
        });

        res.json({ success: true, message: 'Booking confirmed successfully.' });
    } catch (err) {
        next(err);
    }
}

/**
 * Admin: Reject booking
 */
async function rejectBooking(req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);
        const { reason } = req.body;

        const bookings = await query('SELECT * FROM bookings WHERE id = ?', [id]);
        if (bookings.length === 0) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        const booking = bookings[0];
        if (booking.booking_status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Only pending bookings can be rejected. Current status: ${booking.booking_status}`
            });
        }

        await withTransaction(async (conn) => {
            await conn.query(
                `UPDATE bookings SET booking_status = 'rejected', cancellation_reason = ? WHERE id = ?`,
                [reason || 'Rejected by administrator', id]
            );

            // Refund any deposit
            await conn.query(
                `UPDATE deposits SET status = 'refunded', refunded_amount = amount WHERE booking_id = ? AND status = 'held'`,
                [id]
            );
        });

        await createNotification({
            userId: booking.user_id,
            title: 'Booking Rejected',
            message: `Your booking request ${booking.booking_code} could not be accepted. Reason: ${reason || 'Not specified'}.`,
            type: 'booking',
            linkUrl: `/customer/my-bookings`
        });

        await logAudit({
            userId: req.user.id,
            action: 'BOOKING_REJECT',
            entityType: 'BOOKINGS',
            entityId: id,
            details: { booking_code: booking.booking_code, reason },
            ipAddress: req.ip
        });

        res.json({ success: true, message: 'Booking rejected successfully.' });
    } catch (err) {
        next(err);
    }
}

/**
 * Admin: Get all bookings with filtering and pagination
 */
async function getAllBookings(req, res, next) {
    try {
        const { status, search, start_date, end_date } = req.query;

        let sql = `
            SELECT b.*,
                   u.full_name as customer_name, u.email as customer_email, u.phone as customer_phone,
                   v.name as vehicle_name, v.brand as vehicle_brand, v.license_plate,
                   c.name as category_name,
                   pl.name as pickup_location_name,
                   rl.name as return_location_name,
                   d.status as deposit_status
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN vehicles v ON b.vehicle_id = v.id
            JOIN categories c ON v.category_id = c.id
            JOIN locations pl ON b.pickup_location_id = pl.id
            JOIN locations rl ON b.return_location_id = rl.id
            LEFT JOIN deposits d ON d.booking_id = b.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            sql += ' AND b.booking_status = ?';
            params.push(status);
        }

        if (search) {
            sql += ' AND (b.booking_code LIKE ? OR u.full_name LIKE ? OR u.email LIKE ? OR v.name LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term, term);
        }

        if (start_date) {
            sql += ' AND b.pickup_datetime >= ?';
            params.push(start_date);
        }

        if (end_date) {
            sql += ' AND b.return_datetime <= ?';
            params.push(end_date);
        }

        sql += ' ORDER BY b.id DESC';

        const bookings = await query(sql, params);
        res.json({ success: true, count: bookings.length, data: bookings });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    createBooking,
    getMyBookings,
    getBookingById,
    cancelBooking,
    confirmBooking,
    rejectBooking,
    getAllBookings
};
