require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const assert = require('assert');
const { query, withTransaction } = require('../src/config/db');
const { signToken, verifyToken } = require('../src/config/jwt');
const { checkVehicleAvailability, checkAvailabilityInTransaction } = require('../src/services/bookingAvailabilityService');
const { calculateRentalPrice, calculateLateFee } = require('../src/services/pricingService');
const bcrypt = require('bcryptjs');

let passedTests = 0;
let totalTests = 0;

function it(name, fn) {
    totalTests++;
    try {
        const result = fn();
        if (result && typeof result.then === 'function') {
            return result
                .then(() => {
                    passedTests++;
                    console.log(`  ✓ ${name}`);
                })
                .catch((err) => {
                    console.error(`  ✗ ${name}`);
                    console.error('    Error:', err.message);
                });
        } else {
            passedTests++;
            console.log(`  ✓ ${name}`);
        }
    } catch (err) {
        console.error(`  ✗ ${name}`);
        console.error('    Error:', err.message);
    }
}

async function runTestSuite() {
    console.log('\n=======================================================');
    console.log('   RUNNING RIDENOW AUTOMATED BUSINESS LOGIC TEST SUITE');
    console.log('=======================================================\n');

    // 1. Authentication & JWT Tests
    console.log('1. Authentication & JWT Security Tests:');
    await it('Should correctly hash passwords and verify bcrypt match', async () => {
        const password = 'TestSecretPassword@123';
        const hash = await bcrypt.hash(password, 10);
        const match = await bcrypt.compare(password, hash);
        const mismatch = await bcrypt.compare('WrongPassword', hash);
        assert.strictEqual(match, true);
        assert.strictEqual(mismatch, false);
    });

    await it('Should sign and verify JWT payload with expiration and role', () => {
        const payload = { id: 99, email: 'tester@ridenow.com', role: 'customer' };
        const token = signToken(payload);
        const decoded = verifyToken(token);
        assert.strictEqual(decoded.id, 99);
        assert.strictEqual(decoded.email, 'tester@ridenow.com');
        assert.strictEqual(decoded.role, 'customer');
    });

    // 2. Pricing & Late Fee Calculation Tests
    console.log('\n2. Pricing Engine & Late Fee Calculation Tests:');
    await it('Should calculate hourly pricing for rentals under 24h when hourly is cheaper', async () => {
        const dummyVehicle = { hourly_rate: 50000, daily_rate: 250000, deposit_amount: 500000 };
        const pickup = new Date('2026-12-01T08:00:00');
        const dropoff = new Date('2026-12-01T12:00:00'); // 4 hours
        const pricing = await calculateRentalPrice(dummyVehicle, pickup, dropoff);
        assert.strictEqual(pricing.durationHours, 4);
        assert.strictEqual(pricing.rentalFee, 200000); // 4 * 50,000 = 200,000 (< 250,000)
        assert.strictEqual(pricing.rentalType, 'hourly');
    });

    await it('Should cap rental fee at daily rate if hourly exceeds daily rate', async () => {
        const dummyVehicle = { hourly_rate: 50000, daily_rate: 250000, deposit_amount: 500000 };
        const pickup = new Date('2026-12-01T08:00:00');
        const dropoff = new Date('2026-12-01T18:00:00'); // 10 hours * 50k = 500k > 250k
        const pricing = await calculateRentalPrice(dummyVehicle, pickup, dropoff);
        assert.strictEqual(pricing.rentalFee, 250000);
        assert.strictEqual(pricing.rentalType, 'daily');
    });

    await it('Should correctly calculate late return fee exceeding 15 min grace period', async () => {
        const scheduled = new Date('2026-12-01T18:00:00');
        const actual = new Date('2026-12-01T20:30:00'); // 2.5 hours late
        const late = await calculateLateFee(scheduled, actual);
        assert.strictEqual(late.isLate, true);
        assert.strictEqual(late.lateHours, 3); // Ceil to 3 hours
        assert.strictEqual(late.lateFee, 150000); // 3 * 50,000
    });

    await it('Should waive late fee if return is within 15 minutes grace period', async () => {
        const scheduled = new Date('2026-12-01T18:00:00');
        const actual = new Date('2026-12-01T18:10:00'); // 10 min late (within 15 min grace)
        const late = await calculateLateFee(scheduled, actual);
        assert.strictEqual(late.isLate, false);
        assert.strictEqual(late.lateFee, 0);
    });

    // 3. Dynamic Availability & Anti-Double-Booking Tests
    console.log('\n3. Availability & Transactional Anti-Double-Booking Tests:');
    await it('Should detect vehicle under maintenance as unavailable', async () => {
        // Vehicle 10 was seeded as maintenance
        const avail = await checkVehicleAvailability(10, '2026-12-10 08:00:00', '2026-12-12 18:00:00');
        assert.strictEqual(avail.available, false);
        assert.ok(avail.reason.includes('maintenance'));
    });

    await it('Should detect conflict when vehicle has overlapping confirmed or active booking', async () => {
        // Vehicle 4 is active from 2026-11-05 09:00:00 to 2026-11-08 18:00:00
        const avail = await checkVehicleAvailability(4, '2026-11-06 10:00:00', '2026-11-07 10:00:00');
        assert.strictEqual(avail.available, false);
        assert.ok(avail.conflicts.length > 0);
    });

    await it('Should allow booking outside the occupied date range', async () => {
        // Vehicle 4 for dates in December 2026
        const avail = await checkVehicleAvailability(4, '2026-12-01 08:00:00', '2026-12-03 18:00:00');
        assert.strictEqual(avail.available, true);
    });

    await it('Rental extension check should exclude current booking itself', async () => {
        // Booking 2 is for vehicle 4 (ending 2026-11-08 18:00:00).
        // Extending it to 2026-11-10 18:00:00 excluding booking 2 should succeed!
        const avail = await checkVehicleAvailability(4, '2026-11-08 18:00:00', '2026-11-10 18:00:00', 2);
        assert.strictEqual(avail.available, true);
    });

    await it('Transactional checkAvailabilityInTransaction should prevent double-booking with row-level locks', async () => {
        await withTransaction(async (conn) => {
            // Check vehicle 1 which is available in December
            const avail1 = await checkAvailabilityInTransaction(conn, 1, '2026-12-15 08:00:00', '2026-12-18 18:00:00');
            assert.strictEqual(avail1.available, true);

            // Check vehicle 4 during its active rental period
            const avail2 = await checkAvailabilityInTransaction(conn, 4, '2026-11-06 10:00:00', '2026-11-07 10:00:00');
            assert.strictEqual(avail2.available, false);
        });
    });

    console.log(`\n=======================================================`);
    console.log(` Test Results: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log(`=======================================================\n`);

    if (passedTests !== totalTests) {
        process.exit(1);
    }
}

runTestSuite().catch((err) => {
    console.error('Test suite failed:', err);
    process.exit(1);
});
