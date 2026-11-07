const { query } = require('../config/db');
const { getVehicleBookedIntervals, checkVehicleAvailability } = require('../services/bookingAvailabilityService');
const { logAudit } = require('../services/auditService');

/**
 * Public vehicle exploration and search
 */
async function getVehicles(req, res, next) {
    try {
        const {
            search,
            category,
            location,
            status,
            min_price,
            max_price,
            min_rating,
            sort,
            pickup_date,
            return_date
        } = req.query;

        let sql = `
            SELECT v.*, 
                   c.name as category_name, c.slug as category_slug,
                   l.name as location_name, l.address as location_address, l.city as location_city
            FROM vehicles v
            JOIN categories c ON v.category_id = c.id
            JOIN locations l ON v.location_id = l.id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            sql += ' AND (v.name LIKE ? OR v.brand LIKE ? OR v.model LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term);
        }

        if (category) {
            if (isNaN(category)) {
                sql += ' AND c.slug = ?';
                params.push(category);
            } else {
                sql += ' AND v.category_id = ?';
                params.push(parseInt(category, 10));
            }
        }

        if (location) {
            sql += ' AND v.location_id = ?';
            params.push(parseInt(location, 10));
        }

        if (status) {
            sql += ' AND v.status = ?';
            params.push(status);
        }

        if (min_price) {
            sql += ' AND v.daily_rate >= ?';
            params.push(parseFloat(min_price));
        }

        if (max_price) {
            sql += ' AND v.daily_rate <= ?';
            params.push(parseFloat(max_price));
        }

        if (min_rating) {
            sql += ' AND v.rating >= ?';
            params.push(parseFloat(min_rating));
        }

        // Sorting
        switch (sort) {
            case 'price_asc':
                sql += ' ORDER BY v.daily_rate ASC';
                break;
            case 'price_desc':
                sql += ' ORDER BY v.daily_rate DESC';
                break;
            case 'rating_desc':
                sql += ' ORDER BY v.rating DESC';
                break;
            case 'newest':
            default:
                sql += ' ORDER BY v.id DESC';
                break;
        }

        const vehicles = await query(sql, params);

        // If date range is specified, calculate availability for each vehicle
        if (pickup_date && return_date) {
            const results = [];
            for (const v of vehicles) {
                const avail = await checkVehicleAvailability(v.id, pickup_date, return_date);
                results.push({
                    ...v,
                    is_available_for_dates: avail.available,
                    availability_reason: avail.reason || null
                });
            }
            return res.json({ success: true, count: results.length, data: results });
        }

        res.json({ success: true, count: vehicles.length, data: vehicles });
    } catch (err) {
        next(err);
    }
}

/**
 * Get single vehicle details
 */
async function getVehicleById(req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);
        const sql = `
            SELECT v.*, 
                   c.name as category_name, c.slug as category_slug,
                   l.name as location_name, l.address as location_address, l.city as location_city, l.phone as location_phone
            FROM vehicles v
            JOIN categories c ON v.category_id = c.id
            JOIN locations l ON v.location_id = l.id
            WHERE v.id = ?
        `;
        const vehicles = await query(sql, [id]);
        if (vehicles.length === 0) {
            return res.status(404).json({ success: false, message: 'Vehicle not found.' });
        }

        const vehicle = vehicles[0];

        // Fetch gallery images
        const images = await query('SELECT id, image_url, is_primary FROM vehicle_images WHERE vehicle_id = ? ORDER BY is_primary DESC', [id]);

        // Fetch recent reviews
        const reviews = await query(`
            SELECT r.id, r.rating, r.comment, r.created_at, u.full_name as customer_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.vehicle_id = ? AND r.is_approved = TRUE
            ORDER BY r.created_at DESC
        `, [id]);

        res.json({
            success: true,
            data: {
                ...vehicle,
                images,
                reviews
            }
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Get booked schedule for a vehicle
 */
async function getVehicleAvailabilityCalendar(req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);
        const bookedIntervals = await getVehicleBookedIntervals(id);
        res.json({
            success: true,
            vehicle_id: id,
            bookedIntervals
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Admin: Add new vehicle
 */
async function createVehicle(req, res, next) {
    try {
        const {
            name,
            brand,
            model,
            category_id,
            location_id,
            license_plate,
            hourly_rate,
            daily_rate,
            weekly_rate,
            monthly_rate,
            deposit_amount,
            status = 'available',
            vehicle_condition = 'excellent',
            description,
            specifications,
            features,
            image_url,
            additional_images
        } = req.body;

        if (!name || !brand || !category_id || !location_id || !hourly_rate || !daily_rate) {
            return res.status(400).json({ success: false, message: 'Missing required vehicle fields.' });
        }

        const validStatuses = ['available', 'rented', 'maintenance', 'unavailable'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        const sql = `
            INSERT INTO vehicles (
                name, brand, model, category_id, location_id, license_plate,
                hourly_rate, daily_rate, weekly_rate, monthly_rate, deposit_amount,
                status, vehicle_condition, description, specifications, features, image_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await query(sql, [
            name.trim(),
            brand.trim(),
            model ? model.trim() : null,
            parseInt(category_id, 10),
            parseInt(location_id, 10),
            license_plate ? license_plate.trim() : null,
            parseFloat(hourly_rate),
            parseFloat(daily_rate),
            weekly_rate ? parseFloat(weekly_rate) : null,
            monthly_rate ? parseFloat(monthly_rate) : null,
            deposit_amount ? parseFloat(deposit_amount) : 500000.00,
            status,
            vehicle_condition,
            description || null,
            specifications ? JSON.stringify(specifications) : null,
            features ? JSON.stringify(features) : null,
            image_url || null
        ]);

        const newId = result.insertId;

        // Add primary image to vehicle_images
        if (image_url) {
            await query('INSERT INTO vehicle_images (vehicle_id, image_url, is_primary) VALUES (?, ?, TRUE)', [newId, image_url]);
        }

        // Add additional images
        if (Array.isArray(additional_images)) {
            for (const img of additional_images) {
                if (img) {
                    await query('INSERT INTO vehicle_images (vehicle_id, image_url, is_primary) VALUES (?, ?, FALSE)', [newId, img]);
                }
            }
        }

        await logAudit({
            userId: req.user.id,
            action: 'VEHICLE_CREATE',
            entityType: 'VEHICLES',
            entityId: newId,
            details: { name, brand, category_id, location_id, status },
            ipAddress: req.ip
        });

        res.status(201).json({ success: true, message: 'Vehicle created successfully.', id: newId });
    } catch (err) {
        next(err);
    }
}

/**
 * Admin: Update vehicle
 */
async function updateVehicle(req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);
        const {
            name,
            brand,
            model,
            category_id,
            location_id,
            license_plate,
            hourly_rate,
            daily_rate,
            weekly_rate,
            monthly_rate,
            deposit_amount,
            status,
            vehicle_condition,
            description,
            specifications,
            features,
            image_url
        } = req.body;

        const check = await query('SELECT id, status FROM vehicles WHERE id = ?', [id]);
        if (check.length === 0) {
            return res.status(404).json({ success: false, message: 'Vehicle not found.' });
        }

        const validStatuses = ['available', 'rented', 'maintenance', 'unavailable'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        const sql = `
            UPDATE vehicles SET
                name = COALESCE(?, name),
                brand = COALESCE(?, brand),
                model = COALESCE(?, model),
                category_id = COALESCE(?, category_id),
                location_id = COALESCE(?, location_id),
                license_plate = COALESCE(?, license_plate),
                hourly_rate = COALESCE(?, hourly_rate),
                daily_rate = COALESCE(?, daily_rate),
                weekly_rate = COALESCE(?, weekly_rate),
                monthly_rate = COALESCE(?, monthly_rate),
                deposit_amount = COALESCE(?, deposit_amount),
                status = COALESCE(?, status),
                vehicle_condition = COALESCE(?, vehicle_condition),
                description = COALESCE(?, description),
                specifications = COALESCE(?, specifications),
                features = COALESCE(?, features),
                image_url = COALESCE(?, image_url)
            WHERE id = ?
        `;

        await query(sql, [
            name ? name.trim() : null,
            brand ? brand.trim() : null,
            model ? model.trim() : null,
            category_id ? parseInt(category_id, 10) : null,
            location_id ? parseInt(location_id, 10) : null,
            license_plate ? license_plate.trim() : null,
            hourly_rate ? parseFloat(hourly_rate) : null,
            daily_rate ? parseFloat(daily_rate) : null,
            weekly_rate !== undefined ? (weekly_rate ? parseFloat(weekly_rate) : null) : null,
            monthly_rate !== undefined ? (monthly_rate ? parseFloat(monthly_rate) : null) : null,
            deposit_amount ? parseFloat(deposit_amount) : null,
            status || null,
            vehicle_condition || null,
            description !== undefined ? description : null,
            specifications ? JSON.stringify(specifications) : null,
            features ? JSON.stringify(features) : null,
            image_url || null,
            id
        ]);

        await logAudit({
            userId: req.user.id,
            action: 'VEHICLE_UPDATE',
            entityType: 'VEHICLES',
            entityId: id,
            details: { name, status, daily_rate },
            ipAddress: req.ip
        });

        res.json({ success: true, message: 'Vehicle updated successfully.' });
    } catch (err) {
        next(err);
    }
}

/**
 * Admin: Delete vehicle with check for active bookings
 */
async function deleteVehicle(req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);

        // Check if vehicle has active or confirmed bookings
        const activeBookings = await query(
            "SELECT id, booking_code, booking_status FROM bookings WHERE vehicle_id = ? AND booking_status IN ('confirmed', 'active')",
            [id]
        );

        if (activeBookings.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete vehicle with ${activeBookings.length} confirmed or active bookings. Complete or cancel bookings first, or set status to Unavailable.`
            });
        }

        await query('DELETE FROM vehicles WHERE id = ?', [id]);

        await logAudit({
            userId: req.user.id,
            action: 'VEHICLE_DELETE',
            entityType: 'VEHICLES',
            entityId: id,
            ipAddress: req.ip
        });

        res.json({ success: true, message: 'Vehicle deleted successfully.' });
    } catch (err) {
        next(err);
    }
}

/**
 * Get categories list
 */
async function getCategories(req, res, next) {
    try {
        const categories = await query(`
            SELECT c.*, 
                   (SELECT COUNT(*) FROM vehicles v WHERE v.category_id = c.id AND v.status = 'available') as available_count,
                   (SELECT COUNT(*) FROM vehicles v WHERE v.category_id = c.id) as total_count
            FROM categories c
            ORDER BY c.id ASC
        `);
        res.json({ success: true, data: categories });
    } catch (err) {
        next(err);
    }
}

/**
 * Get locations list
 */
async function getLocations(req, res, next) {
    try {
        const locations = await query(`
            SELECT l.*,
                   (SELECT COUNT(*) FROM vehicles v WHERE v.location_id = l.id AND v.status = 'available') as available_count
            FROM locations l
            ORDER BY l.id ASC
        `);
        res.json({ success: true, data: locations });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getVehicles,
    getVehicleById,
    getVehicleAvailabilityCalendar,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    getCategories,
    getLocations
};
