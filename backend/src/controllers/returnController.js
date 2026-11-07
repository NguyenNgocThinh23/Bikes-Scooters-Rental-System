const { query, withTransaction } = require('../config/db');
const { calculateLateFee } = require('../services/pricingService');
const { createNotification } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');

/**
 * Admin: Handover vehicle to customer (status -> active, vehicle -> rented)
 */
async function processPickup(req, res, next) {
    try {
        const { booking_id, actual_pickup_datetime, pickup_notes } = req.body;
        if (!booking_id) {
            return res.status(400).json({ success: false, message: 'Booking ID is required.' });
        }

        const bookings = await query('SELECT * FROM bookings WHERE id = ?', [booking_id]);
        if (bookings.length === 0) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        const booking = bookings[0];
        if (booking.booking_status !== 'confirmed') {
            return res.status(400).json({
                success: false,
                message: `Cannot process pickup. Booking status must be 'confirmed'. Current status: ${booking.booking_status}`
            });
        }

        const pickupTime = actual_pickup_datetime ? new Date(actual_pickup_datetime) : new Date();

        await withTransaction(async (conn) => {
            // Update booking to Active
            await conn.query(`
                UPDATE bookings SET
                    booking_status = 'active',
                    actual_pickup_datetime = ?,
                    notes = CONCAT(COALESCE(notes, ''), '\n[Pickup Note]: ', ?)
                WHERE id = ?
            `, [pickupTime, pickup_notes || 'Handed over in good condition', booking_id]);

            // Update vehicle operational status to Rented
            await conn.query(`
                UPDATE vehicles SET status = 'rented', total_trips = total_trips + 1 WHERE id = ?
            `, [booking.vehicle_id]);
        });

        await createNotification({
            userId: booking.user_id,
            title: 'Ride Started! Enjoy Your Journey',
            message: `Your rental for booking ${booking.booking_code} is now active. Return deadline: ${new Date(booking.return_datetime).toLocaleString()}.`,
            type: 'pickup',
            linkUrl: `/customer/active-rentals`
        });

        await logAudit({
            userId: req.user.id,
            action: 'RENTAL_PICKUP',
            entityType: 'BOOKINGS',
            entityId: booking_id,
            details: { booking_code: booking.booking_code, pickupTime },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Vehicle handover completed. Rental is now active.',
            data: {
                booking_id,
                status: 'active',
                actual_pickup_datetime: pickupTime
            }
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Admin: Process vehicle return inspection (status -> completed, vehicle -> available / maintenance)
 */
async function processReturn(req, res, next) {
    try {
        const {
            booking_id,
            actual_return_datetime,
            inspection_condition = 'good',
            damages_found,
            damage_fee = 0,
            return_notes,
            next_vehicle_status = 'available'
        } = req.body;

        if (!booking_id) {
            return res.status(400).json({ success: false, message: 'Booking ID is required.' });
        }

        const bookings = await query('SELECT * FROM bookings WHERE id = ?', [booking_id]);
        if (bookings.length === 0) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        const booking = bookings[0];
        if (booking.booking_status !== 'active') {
            return res.status(400).json({
                success: false,
                message: `Cannot process return. Booking must be 'active'. Current status: ${booking.booking_status}`
            });
        }

        const returnTime = actual_return_datetime ? new Date(actual_return_datetime) : new Date();

        // Calculate late fee
        const lateCalc = await calculateLateFee(booking.return_datetime, returnTime);
        const parsedDamageFee = Math.max(0, parseFloat(damage_fee) || 0);
        const totalAdditional = lateCalc.lateFee + parsedDamageFee;

        // Calculate deposit deduction and refund
        const depositAmount = parseFloat(booking.deposit_amount);
        let depositStatus = 'held';
        let refundedAmount = 0;
        let deductedAmount = 0;
        let deductionReason = null;

        if (totalAdditional > 0) {
            deductedAmount = Math.min(totalAdditional, depositAmount);
            refundedAmount = Math.max(0, depositAmount - deductedAmount);
            deductionReason = `Deductions: Late fee (${lateCalc.lateFee.toLocaleString()} VND) + Damages (${parsedDamageFee.toLocaleString()} VND)`;
            depositStatus = refundedAmount > 0 ? 'partially_refunded' : 'deducted';
        } else {
            refundedAmount = depositAmount;
            depositStatus = 'refunded';
            deductionReason = 'No damages or late fees. Full deposit refunded.';
        }

        const resolvedVehicleStatus = next_vehicle_status === 'maintenance' || inspection_condition === 'damaged'
            ? 'maintenance'
            : 'available';

        await withTransaction(async (conn) => {
            // 1. Insert return inspection record
            await conn.query(`
                INSERT INTO rental_returns (
                    booking_id, vehicle_id, processed_by_user_id,
                    scheduled_return_datetime, actual_return_datetime,
                    is_late, late_hours, late_fee,
                    inspection_condition, damages_found, damage_fee,
                    return_notes, next_vehicle_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                booking_id,
                booking.vehicle_id,
                req.user.id,
                booking.return_datetime,
                returnTime,
                lateCalc.isLate,
                lateCalc.lateHours,
                lateCalc.lateFee,
                inspection_condition,
                damages_found || null,
                parsedDamageFee,
                return_notes || null,
                resolvedVehicleStatus
            ]);

            // 2. Update booking status to completed
            await conn.query(`
                UPDATE bookings SET
                    booking_status = 'completed',
                    actual_return_datetime = ?,
                    late_fee = ?,
                    damage_fee = ?,
                    total_amount = total_amount + ?
                WHERE id = ?
            `, [returnTime, lateCalc.lateFee, parsedDamageFee, totalAdditional, booking_id]);

            // 3. Update deposit status
            await conn.query(`
                UPDATE deposits SET
                    status = ?,
                    refunded_amount = ?,
                    deducted_amount = ?,
                    deduction_reason = ?,
                    refund_transaction_id = ?
                WHERE booking_id = ?
            `, [
                depositStatus,
                refundedAmount,
                deductedAmount,
                deductionReason,
                `REF-${Date.now()}`,
                booking_id
            ]);

            // 4. Update vehicle status and condition
            await conn.query(`
                UPDATE vehicles SET
                    status = ?,
                    vehicle_condition = ?
                WHERE id = ?
            `, [resolvedVehicleStatus, inspection_condition === 'damaged' ? 'fair' : inspection_condition, booking.vehicle_id]);

            // 5. If vehicle needs maintenance, log maintenance schedule
            if (resolvedVehicleStatus === 'maintenance') {
                await conn.query(`
                    INSERT INTO vehicle_maintenance (
                        vehicle_id, maintenance_type, scheduled_date, status, description, notes
                    ) VALUES (?, 'Post-Rental Inspection & Repair', CURDATE(), 'scheduled', ?, ?)
                `, [booking.vehicle_id, damages_found || 'Vehicle marked for inspection post-rental', return_notes || null]);
            }
        });

        await createNotification({
            userId: booking.user_id,
            title: 'Rental Completed & Inspected',
            message: `Your rental ${booking.booking_code} has ended. Deposit refund: ${refundedAmount.toLocaleString()} VND (${depositStatus}).`,
            type: 'return',
            linkUrl: `/customer/rental-history`
        });

        await logAudit({
            userId: req.user.id,
            action: 'RENTAL_RETURN',
            entityType: 'RENTAL_RETURNS',
            entityId: booking_id,
            details: {
                booking_code: booking.booking_code,
                is_late: lateCalc.isLate,
                late_fee: lateCalc.lateFee,
                damage_fee: parsedDamageFee,
                depositStatus,
                refundedAmount
            },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Vehicle return inspection completed successfully.',
            data: {
                booking_id,
                booking_status: 'completed',
                vehicle_status: resolvedVehicleStatus,
                is_late: lateCalc.isLate,
                late_hours: lateCalc.lateHours,
                late_fee: lateCalc.lateFee,
                damage_fee: parsedDamageFee,
                deposit_status: depositStatus,
                deposit_refunded: refundedAmount,
                deposit_deducted: deductedAmount
            }
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    processPickup,
    processReturn
};
