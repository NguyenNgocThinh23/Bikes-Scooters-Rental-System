const { query, withTransaction } = require('../config/db');

/**
 * Customer: Add review for a completed booking
 */
async function addReview(req, res, next) {
    try {
        const { booking_id, rating, comment } = req.body;
        if (!booking_id || !rating) {
            return res.status(400).json({ success: false, message: 'Booking ID and star rating (1-5) are required.' });
        }

        const parsedRating = parseInt(rating, 10);
        if (parsedRating < 1 || parsedRating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5.' });
        }

        // Verify customer owns this completed booking
        const bookings = await query(
            'SELECT id, user_id, vehicle_id, booking_status FROM bookings WHERE id = ?',
            [booking_id]
        );

        if (bookings.length === 0) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        const booking = bookings[0];
        if (booking.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'You can only review your own bookings.' });
        }

        if (booking.booking_status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Reviews are only permitted for completed rentals after the vehicle has been safely returned.'
            });
        }

        // Check if already reviewed
        const existing = await query('SELECT id FROM reviews WHERE booking_id = ?', [booking_id]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'You have already submitted a review for this rental.' });
        }

        await withTransaction(async (conn) => {
            await conn.query(`
                INSERT INTO reviews (booking_id, vehicle_id, user_id, rating, comment, is_approved)
                VALUES (?, ?, ?, ?, ?, TRUE)
            `, [booking_id, booking.vehicle_id, req.user.id, parsedRating, comment || null]);

            // Recalculate average vehicle rating & review count
            const [avgRows] = await conn.query(`
                SELECT AVG(rating) as avg_rating, COUNT(*) as count
                FROM reviews
                WHERE vehicle_id = ? AND is_approved = TRUE
            `, [booking.vehicle_id]);

            const newRating = parseFloat(avgRows[0].avg_rating || 5.0).toFixed(2);
            const totalCount = parseInt(avgRows[0].count, 10) || 0;

            await conn.query(`
                UPDATE vehicles SET rating = ?, total_reviews = ? WHERE id = ?
            `, [newRating, totalCount, booking.vehicle_id]);
        });

        res.status(201).json({ success: true, message: 'Thank you for your review!' });
    } catch (err) {
        next(err);
    }
}

/**
 * Public: Get reviews (for landing page or vehicle page)
 */
async function getReviews(req, res, next) {
    try {
        const { vehicle_id, limit = 10 } = req.query;

        let sql = `
            SELECT r.*,
                   u.full_name as customer_name,
                   v.name as vehicle_name, v.brand as vehicle_brand, v.image_url as vehicle_image
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            JOIN vehicles v ON r.vehicle_id = v.id
            WHERE r.is_approved = TRUE
        `;
        const params = [];

        if (vehicle_id) {
            sql += ' AND r.vehicle_id = ?';
            params.push(parseInt(vehicle_id, 10));
        }

        sql += ' ORDER BY r.id DESC LIMIT ?';
        params.push(parseInt(limit, 10));

        const reviews = await query(sql, params);
        res.json({ success: true, count: reviews.length, data: reviews });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    addReview,
    getReviews
};
