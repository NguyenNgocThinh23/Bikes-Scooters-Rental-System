const { query } = require('../config/db');

/**
 * Calculates rental cost breakdown for a vehicle and duration
 */
async function calculateRentalPrice(vehicle, pickupDateTime, returnDateTime) {
    const pickup = new Date(pickupDateTime);
    const dropoff = new Date(returnDateTime);

    const diffMs = dropoff.getTime() - pickup.getTime();
    const durationHours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
    const durationDays = Math.ceil(durationHours / 24);

    const hourlyRate = parseFloat(vehicle.hourly_rate);
    const dailyRate = parseFloat(vehicle.daily_rate);
    const weeklyRate = vehicle.weekly_rate ? parseFloat(vehicle.weekly_rate) : dailyRate * 6;
    const monthlyRate = vehicle.monthly_rate ? parseFloat(vehicle.monthly_rate) : dailyRate * 20;

    let rentalFee = 0;
    let rentalType = 'daily';

    if (durationHours < 24) {
        // Less than 24h: compare pure hourly vs full 1-day cap
        const hourlyCost = durationHours * hourlyRate;
        if (hourlyCost < dailyRate) {
            rentalFee = hourlyCost;
            rentalType = 'hourly';
        } else {
            rentalFee = dailyRate;
            rentalType = 'daily';
        }
    } else if (durationDays >= 30) {
        const months = Math.floor(durationDays / 30);
        const remDays = durationDays % 30;
        rentalFee = (months * monthlyRate) + (remDays * dailyRate);
        rentalType = 'monthly';
    } else if (durationDays >= 7) {
        const weeks = Math.floor(durationDays / 7);
        const remDays = durationDays % 7;
        rentalFee = (weeks * weeklyRate) + (remDays * dailyRate);
        rentalType = 'weekly';
    } else {
        rentalFee = durationDays * dailyRate;
        rentalType = 'daily';
    }

    const depositAmount = parseFloat(vehicle.deposit_amount || 500000);
    const discountAmount = 0.00;
    const totalAmount = rentalFee - discountAmount;

    return {
        durationHours,
        durationDays,
        rentalType,
        hourlyRate,
        dailyRate,
        rentalFee,
        depositAmount,
        discountAmount,
        totalAmount
    };
}

/**
 * Calculates late fee given scheduled return and actual return
 */
async function calculateLateFee(scheduledReturn, actualReturn) {
    const scheduled = new Date(scheduledReturn);
    const actual = new Date(actualReturn);

    if (actual <= scheduled) {
        return { isLate: false, lateHours: 0, lateFee: 0 };
    }

    const diffMs = actual.getTime() - scheduled.getTime();
    // Allow 15 minutes grace period
    const graceMs = 15 * 60 * 1000;
    if (diffMs <= graceMs) {
        return { isLate: false, lateHours: 0, lateFee: 0 };
    }

    const lateHours = Math.ceil((diffMs - graceMs) / (1000 * 60 * 60));

    // Get late fee rate from system settings
    const settings = await query("SELECT setting_value FROM system_settings WHERE setting_key = 'late_fee_per_hour'");
    const ratePerHour = settings.length > 0 ? parseFloat(settings[0].setting_value) : 50000;

    const lateFee = lateHours * ratePerHour;

    return {
        isLate: true,
        lateHours,
        lateFee
    };
}

module.exports = {
    calculateRentalPrice,
    calculateLateFee
};
