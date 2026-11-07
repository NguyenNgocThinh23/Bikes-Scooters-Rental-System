const { query } = require('../config/db');

/**
 * Checks if a vehicle is available for a requested datetime interval
 * @param {number} vehicleId
 * @param {string|Date} pickupDateTime
 * @param {string|Date} returnDateTime
 * @param {number|null} excludeBookingId
 * @returns {Promise<{ available: boolean, reason?: string, conflicts?: Array }>}
 */
async function checkVehicleAvailability(vehicleId, pickupDateTime, returnDateTime, excludeBookingId = null) {
    const pickup = new Date(pickupDateTime);
    const dropoff = new Date(returnDateTime);

    if (isNaN(pickup.getTime()) || isNaN(dropoff.getTime())) {
        return { available: false, reason: 'Invalid pickup or return datetime provided.' };
    }

    if (dropoff <= pickup) {
        return { available: false, reason: 'Return time must be after pickup time.' };
    }

    // 1. Check vehicle operational status
    const vehicles = await query('SELECT id, name, status, hourly_rate, daily_rate, deposit_amount FROM vehicles WHERE id = ?', [vehicleId]);
    if (!vehicles || vehicles.length === 0) {
        return { available: false, reason: 'Vehicle not found.' };
    }

    const vehicle = vehicles[0];
    if (vehicle.status === 'maintenance') {
        return { available: false, reason: 'Vehicle is currently under maintenance and cannot be reserved.' };
    }
    if (vehicle.status === 'unavailable') {
        return { available: false, reason: 'Vehicle is currently decommissioned or unavailable.' };
    }

    // 2. Query for overlapping Confirmed or Active bookings
    let sql = `
        SELECT id, booking_code, pickup_datetime, return_datetime, booking_status
        FROM bookings
        WHERE vehicle_id = ?
          AND booking_status IN ('confirmed', 'active')
          AND pickup_datetime < ?
          AND return_datetime > ?
    `;
    const params = [vehicleId, dropoff, pickup];

    if (excludeBookingId) {
        sql += ' AND id != ?';
        params.push(excludeBookingId);
    }

    const conflicts = await query(sql, params);

    if (conflicts.length > 0) {
        return {
            available: false,
            reason: 'Vehicle has an overlapping confirmed or active reservation during the requested period.',
            conflicts
        };
    }

    return { available: true, vehicle };
}

/**
 * Transactional availability check with row locks (FOR UPDATE)
 * Used inside Admin confirmation and extension approvals to prevent race conditions.
 */
async function checkAvailabilityInTransaction(connection, vehicleId, pickupDateTime, returnDateTime, excludeBookingId = null) {
    const pickup = new Date(pickupDateTime);
    const dropoff = new Date(returnDateTime);

    // Lock vehicle row
    const [vehicles] = await connection.query(
        'SELECT id, name, status FROM vehicles WHERE id = ? FOR UPDATE',
        [vehicleId]
    );

    if (!vehicles || vehicles.length === 0) {
        return { available: false, reason: 'Vehicle not found.' };
    }

    const vehicle = vehicles[0];
    if (vehicle.status === 'maintenance' || vehicle.status === 'unavailable') {
        return { available: false, reason: `Vehicle is currently ${vehicle.status}.` };
    }

    // Lock conflicting bookings
    let sql = `
        SELECT id, booking_code, pickup_datetime, return_datetime, booking_status
        FROM bookings
        WHERE vehicle_id = ?
          AND booking_status IN ('confirmed', 'active')
          AND pickup_datetime < ?
          AND return_datetime > ?
    `;
    const params = [vehicleId, dropoff, pickup];

    if (excludeBookingId) {
        sql += ' AND id != ?';
        params.push(excludeBookingId);
    }

    sql += ' FOR UPDATE';

    const [conflicts] = await connection.query(sql, params);

    if (conflicts.length > 0) {
        return {
            available: false,
            reason: 'A conflicting booking was already confirmed for this vehicle during this time period.',
            conflicts
        };
    }

    return { available: true, vehicle };
}

/**
 * Returns all booked date intervals for a vehicle (for frontend calendar visualization)
 */
async function getVehicleBookedIntervals(vehicleId) {
    const sql = `
        SELECT id, booking_code, pickup_datetime, return_datetime, booking_status
        FROM bookings
        WHERE vehicle_id = ?
          AND booking_status IN ('confirmed', 'active')
          AND return_datetime >= NOW() - INTERVAL 1 DAY
        ORDER BY pickup_datetime ASC
    `;
    return await query(sql, [vehicleId]);
}

module.exports = {
    checkVehicleAvailability,
    checkAvailabilityInTransaction,
    getVehicleBookedIntervals
};
