const crypto = require('crypto');
const { query, withTransaction } = require('../config/db');
const { createNotification } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');

function generateTransactionCode(prefix = 'TX') {
    const hex = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}-RN-${Date.now().toString().slice(-6)}-${hex}`;
}

/**
 * Process payment (Simulated / Demo or Cash/Transfer)
 */
async function processPayment(req, res, next) {
    try {
        const {
            booking_id,
            amount,
            payment_type = 'rental_fee',
            payment_method = 'mock_card',
            transaction_reference
        } = req.body;

        if (!booking_id || !amount) {
            return res.status(400).json({ success: false, message: 'Booking ID and payment amount are required.' });
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid payment amount.' });
        }

        const bookings = await query('SELECT * FROM bookings WHERE id = ?', [booking_id]);
        if (bookings.length === 0) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        const booking = bookings[0];
        if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const validMethods = ['cash', 'bank_transfer', 'mock_card', 'mock_momo'];
        if (!validMethods.includes(payment_method)) {
            return res.status(400).json({ success: false, message: `Invalid payment method. Allowed: ${validMethods.join(', ')}` });
        }

        const transactionCode = generateTransactionCode('TX');
        const isMock = payment_method === 'mock_card' || payment_method === 'mock_momo';
        const simulatedNote = isMock
            ? `[DEMO SIMULATED PAYMENT] Processed successfully via ${payment_method === 'mock_card' ? 'Simulated Credit Card' : 'Simulated MoMo E-Wallet'}. No real financial transaction occurred.`
            : `Payment received via ${payment_method}.`;

        await withTransaction(async (conn) => {
            await conn.query(`
                INSERT INTO payments (
                    transaction_code, booking_id, user_id, amount,
                    payment_type, payment_method, payment_status,
                    transaction_reference, notes
                ) VALUES (?, ?, ?, ?, ?, ?, 'paid', ?, ?)
            `, [
                transactionCode,
                booking_id,
                booking.user_id,
                parsedAmount,
                payment_type,
                payment_method,
                transaction_reference || `REF-${Date.now()}`,
                simulatedNote
            ]);

            // Check total paid vs total amount
            const [paidRows] = await conn.query(
                `SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE booking_id = ? AND payment_status = 'paid'`,
                [booking_id]
            );
            const totalPaid = parseFloat(paidRows[0].total_paid);
            const bookingTotal = parseFloat(booking.total_amount);

            let newPaymentStatus = 'pending';
            if (totalPaid >= bookingTotal) {
                newPaymentStatus = 'paid';
            } else if (totalPaid > 0) {
                newPaymentStatus = 'partially_paid';
            }

            await conn.query('UPDATE bookings SET payment_status = ? WHERE id = ?', [newPaymentStatus, booking_id]);
        });

        await createNotification({
            userId: booking.user_id,
            title: isMock ? 'Simulated Payment Succeeded' : 'Payment Received',
            message: `Payment of ${parsedAmount.toLocaleString()} VND for booking ${booking.booking_code} recorded via ${payment_method}.`,
            type: 'payment',
            linkUrl: `/customer/payment-history`
        });

        await logAudit({
            userId: req.user.id,
            action: 'PAYMENT_PROCESS',
            entityType: 'PAYMENTS',
            entityId: transactionCode,
            details: { booking_code: booking.booking_code, amount: parsedAmount, payment_method, isMock },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: isMock
                ? 'Simulated demo payment processed successfully.'
                : 'Payment recorded successfully.',
            is_simulated: isMock,
            disclaimer: isMock ? 'This was a simulated demo transaction. No actual money was charged.' : null,
            transaction_code: transactionCode,
            amount: parsedAmount,
            payment_method
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Customer: Get payment and deposit history
 */
async function getMyPaymentHistory(req, res, next) {
    try {
        const userId = req.user.id;

        const payments = await query(`
            SELECT p.*, b.booking_code, v.name as vehicle_name
            FROM payments p
            JOIN bookings b ON p.booking_id = b.id
            JOIN vehicles v ON b.vehicle_id = v.id
            WHERE p.user_id = ?
            ORDER BY p.id DESC
        `, [userId]);

        const deposits = await query(`
            SELECT d.*, b.booking_code, v.name as vehicle_name
            FROM deposits d
            JOIN bookings b ON d.booking_id = b.id
            JOIN vehicles v ON b.vehicle_id = v.id
            WHERE d.user_id = ?
            ORDER BY d.id DESC
        `, [userId]);

        res.json({
            success: true,
            payments,
            deposits
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Admin: Get all payments
 */
async function getAllPayments(req, res, next) {
    try {
        const { method, status, search } = req.query;

        let sql = `
            SELECT p.*,
                   b.booking_code,
                   u.full_name as customer_name, u.email as customer_email,
                   v.name as vehicle_name
            FROM payments p
            JOIN bookings b ON p.booking_id = b.id
            JOIN users u ON p.user_id = u.id
            JOIN vehicles v ON b.vehicle_id = v.id
            WHERE 1=1
        `;
        const params = [];

        if (method) {
            sql += ' AND p.payment_method = ?';
            params.push(method);
        }

        if (status) {
            sql += ' AND p.payment_status = ?';
            params.push(status);
        }

        if (search) {
            sql += ' AND (p.transaction_code LIKE ? OR b.booking_code LIKE ? OR u.full_name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        sql += ' ORDER BY p.id DESC';

        const payments = await query(sql, params);

        const deposits = await query(`
            SELECT d.*,
                   b.booking_code,
                   u.full_name as customer_name,
                   v.name as vehicle_name
            FROM deposits d
            JOIN bookings b ON d.booking_id = b.id
            JOIN users u ON d.user_id = u.id
            JOIN vehicles v ON b.vehicle_id = v.id
            ORDER BY d.id DESC
        `);

        res.json({
            success: true,
            payments,
            deposits
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Generate full itemized Invoice data for a booking
 */
async function getInvoiceData(req, res, next) {
    try {
        const bookingId = parseInt(req.params.bookingId, 10);

        const bookings = await query(`
            SELECT b.*,
                   u.full_name as customer_name, u.email as customer_email, u.phone as customer_phone, u.address as customer_address,
                   v.name as vehicle_name, v.brand as vehicle_brand, v.model as vehicle_model, v.license_plate,
                   v.hourly_rate, v.daily_rate,
                   c.name as category_name,
                   pl.name as pickup_location_name, pl.address as pickup_location_address,
                   rl.name as return_location_name, rl.address as return_location_address,
                   d.amount as deposit_amount, d.status as deposit_status,
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
        `, [bookingId]);

        if (bookings.length === 0) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        const booking = bookings[0];

        if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const payments = await query(
            'SELECT * FROM payments WHERE booking_id = ? ORDER BY id ASC',
            [bookingId]
        );

        const totalPaid = payments
            .filter(p => p.payment_status === 'paid' && p.payment_type !== 'deposit')
            .reduce((sum, p) => sum + parseFloat(p.amount), 0);

        const totalAmount = parseFloat(booking.total_amount);
        const balanceDue = Math.max(0, totalAmount - totalPaid);

        const invoice = {
            invoice_number: `INV-${booking.booking_code}`,
            invoice_date: new Date().toISOString(),
            booking_code: booking.booking_code,
            booking_id: booking.id,
            created_at: booking.created_at,
            booking_status: booking.booking_status,
            payment_status: booking.payment_status,
            customer: {
                name: booking.customer_name,
                email: booking.customer_email,
                phone: booking.customer_phone,
                address: booking.customer_address
            },
            vehicle: {
                name: booking.vehicle_name,
                brand: booking.vehicle_brand,
                model: booking.vehicle_model,
                license_plate: booking.license_plate,
                category: booking.category_name,
                rates: {
                    hourly: parseFloat(booking.hourly_rate),
                    daily: parseFloat(booking.daily_rate)
                }
            },
            rental_period: {
                pickup_datetime: booking.pickup_datetime,
                return_datetime: booking.return_datetime,
                actual_pickup_datetime: booking.actual_pickup_datetime,
                actual_return_datetime: booking.actual_return_datetime,
                duration_hours: booking.duration_hours,
                rental_type: booking.rental_type,
                pickup_location: booking.pickup_location_name,
                return_location: booking.return_location_name
            },
            line_items: [
                {
                    description: `Base Rental Fee (${booking.duration_hours} hours / ${booking.rental_type})`,
                    amount: parseFloat(booking.rental_fee)
                },
                ...(parseFloat(booking.extension_fee) > 0 ? [{
                    description: 'Approved Rental Extension Fee',
                    amount: parseFloat(booking.extension_fee)
                }] : []),
                ...(parseFloat(booking.discount_amount) > 0 ? [{
                    description: 'Promotional Discount',
                    amount: -parseFloat(booking.discount_amount)
                }] : []),
                ...(parseFloat(booking.late_fee) > 0 ? [{
                    description: 'Overdue Late Return Fee',
                    amount: parseFloat(booking.late_fee)
                }] : []),
                ...(parseFloat(booking.damage_fee) > 0 ? [{
                    description: 'Damage Assessment & Repair Charges',
                    amount: parseFloat(booking.damage_fee)
                }] : [])
            ],
            financial_summary: {
                rental_fee: parseFloat(booking.rental_fee),
                discount_amount: parseFloat(booking.discount_amount),
                extension_fee: parseFloat(booking.extension_fee),
                late_fee: parseFloat(booking.late_fee),
                damage_fee: parseFloat(booking.damage_fee),
                total_amount: totalAmount,
                total_paid: totalPaid,
                balance_due: balanceDue
            },
            deposit_details: {
                amount: parseFloat(booking.deposit_amount || 0),
                status: booking.deposit_status || 'held',
                refunded_amount: parseFloat(booking.deposit_refunded || 0),
                deducted_amount: parseFloat(booking.deposit_deducted || 0),
                deduction_reason: booking.deposit_deduction_reason
            },
            payments,
            disclaimer: 'This document is a computer-generated simulated rental receipt and invoice from RideNow. Mock online payment methods (MoMo, Card) represent simulated demonstration transactions.'
        };

        res.json({ success: true, data: invoice });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    processPayment,
    getMyPaymentHistory,
    getAllPayments,
    getInvoiceData
};
