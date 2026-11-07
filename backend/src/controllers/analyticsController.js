const { query } = require('../config/db');

/**
 * Admin: Get comprehensive dashboard metrics & chart data computed directly from MySQL
 */
async function getDashboardAnalytics(req, res, next) {
    try {
        // 1. KPI Summary Cards
        const [revenueRow] = await query(`
            SELECT COALESCE(SUM(amount), 0) as total_revenue
            FROM payments
            WHERE payment_status = 'paid' AND payment_type IN ('rental_fee', 'extension_fee', 'late_fee', 'damage_fee')
        `);

        const [bookingCounts] = await query(`
            SELECT 
                COUNT(*) as total_bookings,
                SUM(CASE WHEN booking_status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
                SUM(CASE WHEN booking_status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
                SUM(CASE WHEN booking_status = 'active' THEN 1 ELSE 0 END) as active_rentals,
                SUM(CASE WHEN booking_status = 'completed' THEN 1 ELSE 0 END) as completed_rentals,
                SUM(CASE WHEN booking_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings
            FROM bookings
        `);

        const [customerCounts] = await query(`
            SELECT 
                COUNT(*) as total_customers,
                SUM(CASE WHEN document_verification_status = 'pending' THEN 1 ELSE 0 END) as pending_verifications
            FROM users
            WHERE role = 'customer'
        `);

        const [vehicleCounts] = await query(`
            SELECT 
                COUNT(*) as total_vehicles,
                SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_vehicles,
                SUM(CASE WHEN status = 'rented' THEN 1 ELSE 0 END) as rented_vehicles,
                SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_vehicles,
                SUM(CASE WHEN status = 'unavailable' THEN 1 ELSE 0 END) as unavailable_vehicles
            FROM vehicles
        `);

        // 2. Revenue by Day (Past 14 days)
        const revenueByDay = await query(`
            SELECT 
                DATE_FORMAT(paid_at, '%Y-%m-%d') as date,
                DATE_FORMAT(paid_at, '%d/%m') as label,
                COALESCE(SUM(amount), 0) as revenue
            FROM payments
            WHERE payment_status = 'paid' 
              AND payment_type != 'deposit'
              AND paid_at >= NOW() - INTERVAL 14 DAY
            GROUP BY DATE_FORMAT(paid_at, '%Y-%m-%d'), label
            ORDER BY date ASC
        `);

        // 3. Revenue by Month (Past 6 months)
        const revenueByMonth = await query(`
            SELECT 
                DATE_FORMAT(paid_at, '%Y-%m') as month,
                DATE_FORMAT(paid_at, '%b %Y') as label,
                COALESCE(SUM(amount), 0) as revenue
            FROM payments
            WHERE payment_status = 'paid'
              AND payment_type != 'deposit'
              AND paid_at >= NOW() - INTERVAL 6 MONTH
            GROUP BY DATE_FORMAT(paid_at, '%Y-%m'), label
            ORDER BY month ASC
        `);

        // 4. Vehicle Popularity (Top Rented Vehicles)
        const vehiclePopularity = await query(`
            SELECT 
                v.id, v.name, v.brand, c.name as category_name,
                COUNT(b.id) as booking_count,
                COALESCE(SUM(b.total_amount), 0) as generated_revenue
            FROM vehicles v
            JOIN categories c ON v.category_id = c.id
            LEFT JOIN bookings b ON b.vehicle_id = v.id AND b.booking_status IN ('confirmed', 'active', 'completed')
            GROUP BY v.id, v.name, v.brand, c.name
            ORDER BY booking_count DESC
            LIMIT 5
        `);

        // 5. Fleet Category Distribution
        const categoryDistribution = await query(`
            SELECT 
                c.name as category,
                COUNT(v.id) as count
            FROM categories c
            LEFT JOIN vehicles v ON v.category_id = c.id
            GROUP BY c.id, c.name
        `);

        // 6. Booking Status Distribution
        const statusDistribution = await query(`
            SELECT 
                booking_status as status,
                COUNT(*) as count
            FROM bookings
            GROUP BY booking_status
        `);

        // 7. Fleet Utilization Rate
        const totalFleet = parseInt(vehicleCounts[0].total_vehicles, 10) || 1;
        const rentedFleet = parseInt(vehicleCounts[0].rented_vehicles, 10) || 0;
        const utilizationRate = Math.round((rentedFleet / totalFleet) * 100);

        // 8. Recent Bookings Table
        const recentBookings = await query(`
            SELECT b.id, b.booking_code, b.pickup_datetime, b.return_datetime,
                   b.total_amount, b.booking_status, b.payment_status,
                   u.full_name as customer_name,
                   v.name as vehicle_name
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN vehicles v ON b.vehicle_id = v.id
            ORDER BY b.id DESC
            LIMIT 6
        `);

        res.json({
            success: true,
            kpis: {
                total_revenue: parseFloat(revenueRow.total_revenue),
                total_bookings: parseInt(bookingCounts[0].total_bookings, 10) || 0,
                pending_bookings: parseInt(bookingCounts[0].pending_bookings, 10) || 0,
                active_rentals: parseInt(bookingCounts[0].active_rentals, 10) || 0,
                completed_rentals: parseInt(bookingCounts[0].completed_rentals, 10) || 0,
                total_customers: parseInt(customerCounts[0].total_customers, 10) || 0,
                pending_verifications: parseInt(customerCounts[0].pending_verifications, 10) || 0,
                total_vehicles: totalFleet,
                available_vehicles: parseInt(vehicleCounts[0].available_vehicles, 10) || 0,
                rented_vehicles: rentedFleet,
                maintenance_vehicles: parseInt(vehicleCounts[0].maintenance_vehicles, 10) || 0,
                utilization_rate: utilizationRate
            },
            charts: {
                revenue_by_day: revenueByDay,
                revenue_by_month: revenueByMonth,
                vehicle_popularity: vehiclePopularity,
                category_distribution: categoryDistribution,
                status_distribution: statusDistribution
            },
            recent_bookings: recentBookings
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getDashboardAnalytics
};
