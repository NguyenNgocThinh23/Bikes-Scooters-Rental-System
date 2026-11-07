require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
    console.log('--- Initializing RideNow Database ---');
    console.log(`Target: ${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        multipleStatements: true
    });

    try {
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'ridenow_db'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await connection.changeUser({ database: process.env.DB_NAME || 'ridenow_db' });

        // Run schema
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await connection.query(schemaSql);
        console.log('✓ Schema applied successfully.');

        // Generate password hashes
        const adminPassHash = await bcrypt.hash('Admin@123', 10);
        const customerPassHash = await bcrypt.hash('Customer@123', 10);

        // Check if users exist
        const [existingUsers] = await connection.query('SELECT COUNT(*) as count FROM users');
        if (existingUsers[0].count === 0) {
            console.log('Seeding initial data...');

            // 1. Users
            await connection.query(`
                INSERT INTO users (id, full_name, email, password_hash, phone, address, role, status, document_verification_status) VALUES
                (1, 'RideNow Administrator', 'admin@ridenow.com', ?, '+84 905 111 222', '120 Nguyen Van Linh, Da Nang', 'admin', 'active', 'approved'),
                (2, 'Le Van Customer', 'customer@ridenow.com', ?, '+84 905 333 444', '254 Vo Nguyen Giap, Da Nang', 'customer', 'active', 'approved'),
                (3, 'Nguyen Hoang Nam', 'nam.nguyen@example.com', ?, '+84 905 555 666', '88 Bach Dang, Da Nang', 'customer', 'active', 'pending')
            `, [adminPassHash, customerPassHash, customerPassHash]);

            // 2. Categories
            await connection.query(`
                INSERT INTO categories (id, name, slug, description, image_url, icon, base_hourly_rate, base_daily_rate) VALUES
                (1, 'City Bikes', 'city-bikes', 'Lightweight, comfortable geometry ideal for casual city cruising and daily commutes.', 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80', 'Bike', 30000.00, 150000.00),
                (2, 'Mountain Bikes', 'mountain-bikes', 'Rugged frames, front suspension, and knobby tires designed for rough paths and hills.', 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=800&q=80', 'Mountain', 50000.00, 250000.00),
                (3, 'Electric Bikes', 'electric-bikes', 'Pedal-assist motor providing effortless extended rides along scenic coastal avenues.', 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=800&q=80', 'Zap', 70000.00, 350000.00),
                (4, 'Electric Scooters', 'electric-scooters', 'Modern, agile, foldable e-scooters perfect for quick neighborhood hops and city touring.', 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=800&q=80', 'Navigation', 60000.00, 300000.00),
                (5, 'Motor Scooters', 'motor-scooters', 'Powerful 110-125cc petrol scooters for longer journeys across provinces and coastal passes.', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80', 'Gauge', 100000.00, 450000.00)
            `);

            // 3. Locations
            await connection.query(`
                INSERT INTO locations (id, name, address, city, phone, opening_hours, latitude, longitude) VALUES
                (1, 'Da Nang City Center Hub', '120 Nguyen Van Linh, Hai Chau District', 'Da Nang', '+84 236 3888 111', '06:30 - 22:00', 16.0601, 108.2152),
                (2, 'My Khe Beach Station', '254 Vo Nguyen Giap, Son Tra District', 'Da Nang', '+84 236 3888 222', '06:00 - 23:00', 16.0617, 108.2468),
                (3, 'Han River Waterfront Point', '88 Bach Dang, Hai Chau District', 'Da Nang', '+84 236 3888 333', '07:00 - 22:00', 16.0718, 108.2238),
                (4, 'Son Tra Peninsula Base', 'Hoang Sa Coastal Road, Tho Quang', 'Da Nang', '+84 236 3888 444', '07:00 - 18:30', 16.1025, 108.2612),
                (5, 'Hoi An Ancient Town Branch', '35 Tran Phu, Minh An Ward', 'Hoi An', '+84 235 3999 555', '07:30 - 21:30', 15.8770, 108.3283)
            `);

            // 4. Vehicles
            const vehicles = [
                {
                    id: 1,
                    name: 'Trek Marlin 5',
                    brand: 'Trek',
                    model: 'Marlin 5 Gen 2',
                    category_id: 2,
                    location_id: 1,
                    license_plate: 'BIKE-M5-01',
                    hourly_rate: 50000.00,
                    daily_rate: 250000.00,
                    weekly_rate: 1400000.00,
                    monthly_rate: 4500000.00,
                    deposit_amount: 500000.00,
                    status: 'available',
                    vehicle_condition: 'excellent',
                    description: 'A trail-worthy daily rider with modern geometry, front suspension fork with 100mm travel, and hydraulic disc brakes for supreme all-weather stopping power.',
                    specifications: JSON.stringify({
                        frame: 'Alpha Silver Aluminum, internal routing',
                        fork: 'SR Suntour XCT 30, 100mm travel',
                        drivetrain: 'Shimano Altus 2x8 speed',
                        brakes: 'Tektro HD-M275 hydraulic disc',
                        weight: '13.9 kg',
                        max_load: '136 kg'
                    }),
                    features: JSON.stringify(['Hydraulic Disc Brakes', 'Front Suspension Fork', 'Rear Rack Mounts', 'Lightweight Aluminum Frame']),
                    image_url: 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=900&q=80',
                    rating: 4.90,
                    total_reviews: 14,
                    total_trips: 42
                },
                {
                    id: 2,
                    name: 'Giant Escape 3',
                    brand: 'Giant',
                    model: 'Escape 3 Disc',
                    category_id: 1,
                    location_id: 2,
                    license_plate: 'BIKE-GE3-02',
                    hourly_rate: 30000.00,
                    daily_rate: 150000.00,
                    weekly_rate: 850000.00,
                    monthly_rate: 2700000.00,
                    deposit_amount: 300000.00,
                    status: 'available',
                    vehicle_condition: 'excellent',
                    description: 'An agile, comfortable flat-bar road bike perfect for city commuting, fitness, and casual spins around coastal avenues.',
                    specifications: JSON.stringify({
                        frame: 'ALUXX-Grade Aluminum',
                        fork: 'High-tensile steel with rack mounts',
                        drivetrain: 'Shimano Tourney 3x7 speed',
                        brakes: 'Mechanical disc brakes 160mm',
                        weight: '12.2 kg',
                        max_load: '120 kg'
                    }),
                    features: JSON.stringify(['Comfort Saddle', 'Puncture-Resistant Tires', 'Kickstand Included', 'Bell & Bottle Cage']),
                    image_url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=80',
                    rating: 4.80,
                    total_reviews: 18,
                    total_trips: 56
                },
                {
                    id: 3,
                    name: 'Specialized Rockhopper',
                    brand: 'Specialized',
                    model: 'Rockhopper Sport 29',
                    category_id: 2,
                    location_id: 4,
                    license_plate: 'BIKE-SRH-03',
                    hourly_rate: 55000.00,
                    daily_rate: 270000.00,
                    weekly_rate: 1500000.00,
                    monthly_rate: 4800000.00,
                    deposit_amount: 600000.00,
                    status: 'available',
                    vehicle_condition: 'excellent',
                    description: 'Premium hardtail mountain bike with size-specific wheel sizing, custom SR Suntour XCM fork, and powerful Shimano hydraulic brakes.',
                    specifications: JSON.stringify({
                        frame: 'A1 premium butted alloy',
                        fork: 'SR Suntour XCM 29 with lockout',
                        drivetrain: 'MicroSHIFT 1x9 wide-range',
                        brakes: 'Shimano BR-MT200 Hydraulic',
                        weight: '13.5 kg',
                        max_load: '130 kg'
                    }),
                    features: JSON.stringify(['Wide-range 1x Drivetrain', 'Lockout Suspension', 'Tubeless-Ready Rims', 'Ergonomic Grips']),
                    image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=900&q=80',
                    rating: 4.95,
                    total_reviews: 11,
                    total_trips: 31
                },
                {
                    id: 4,
                    name: 'Xiaomi Electric Scooter 4',
                    brand: 'Xiaomi',
                    model: 'Pro 4th Gen',
                    category_id: 4,
                    location_id: 2,
                    license_plate: 'SCOOT-XM4-04',
                    hourly_rate: 60000.00,
                    daily_rate: 300000.00,
                    weekly_rate: 1700000.00,
                    monthly_rate: 5200000.00,
                    deposit_amount: 1000000.00,
                    status: 'available',
                    vehicle_condition: 'excellent',
                    description: 'Modern, high-torque electric scooter with up to 55 km range, 10-inch self-sealing tubeless tires, and ultra-bright LED headlight.',
                    specifications: JSON.stringify({
                        motor: '350W rated (700W max power)',
                        battery: '446Wh lithium-ion',
                        range: 'Up to 55 km',
                        top_speed: '25 km/h',
                        brakes: 'Dual disc brake & E-ABS',
                        weight: '16.5 kg'
                    }),
                    features: JSON.stringify(['Self-sealing Tubeless Tires', 'Kinetic Energy Recovery (KERS)', 'LED Multi-Function Dashboard', 'Folding in 3 Seconds']),
                    image_url: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=900&q=80',
                    rating: 4.85,
                    total_reviews: 26,
                    total_trips: 78
                },
                {
                    id: 5,
                    name: 'Segway Ninebot Max G2',
                    brand: 'Segway',
                    model: 'Ninebot KickScooter Max G2',
                    category_id: 4,
                    location_id: 1,
                    license_plate: 'SCOOT-SG2-05',
                    hourly_rate: 65000.00,
                    daily_rate: 320000.00,
                    weekly_rate: 1850000.00,
                    monthly_rate: 5600000.00,
                    deposit_amount: 1000000.00,
                    status: 'available',
                    vehicle_condition: 'excellent',
                    description: 'The master of long-distance cruising. Features front and rear hydraulic suspension, RideyLONG technology for 70km range, and anti-skid TCS.',
                    specifications: JSON.stringify({
                        motor: '450W rated (900W peak)',
                        battery: '551Wh with smart BMS',
                        range: 'Up to 70 km',
                        top_speed: '32 km/h',
                        suspension: 'Front hydraulic + Rear dual spring',
                        weight: '24.3 kg'
                    }),
                    features: JSON.stringify(['Dual Suspension System', 'Apple Find My Support', 'Built-in Turn Signals', 'Traction Control System (TCS)']),
                    image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
                    rating: 4.92,
                    total_reviews: 19,
                    total_trips: 64
                },
                {
                    id: 6,
                    name: 'Giant Explore E+',
                    brand: 'Giant',
                    model: 'Explore E+ 2 GTS',
                    category_id: 3,
                    location_id: 3,
                    license_plate: 'EBIKE-GEP-06',
                    hourly_rate: 70000.00,
                    daily_rate: 350000.00,
                    weekly_rate: 2000000.00,
                    monthly_rate: 6200000.00,
                    deposit_amount: 1500000.00,
                    status: 'available',
                    vehicle_condition: 'excellent',
                    description: 'Versatile adventure touring e-bike with Yamaha SyncDrive Sport motor, integrated EnergyPak battery, and hydraulic disc brakes for long scenic explorations.',
                    specifications: JSON.stringify({
                        motor: 'SyncDrive Sport by Yamaha (70Nm)',
                        battery: 'EnergyPak Smart 500Wh',
                        sensor: 'RideControl Dash color screen',
                        range: 'Up to 120 km assist',
                        brakes: 'Shimano MT200 Hydraulic Disc'
                    }),
                    features: JSON.stringify(['Smart Assist Technology', 'Integrated Lights & Fenders', 'Sturdy Rear Cargo Rack', 'Color Display with USB Port']),
                    image_url: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=80',
                    rating: 4.94,
                    total_reviews: 15,
                    total_trips: 47
                },
                {
                    id: 7,
                    name: 'Honda Vision',
                    brand: 'Honda',
                    model: 'Vision SmartKey 110cc',
                    category_id: 5,
                    location_id: 1,
                    license_plate: '43-B1 888.88',
                    hourly_rate: 100000.00,
                    daily_rate: 450000.00,
                    weekly_rate: 2600000.00,
                    monthly_rate: 8000000.00,
                    deposit_amount: 1000000.00,
                    status: 'available',
                    vehicle_condition: 'excellent',
                    description: 'Vietnam\'s most popular compact automatic scooter. Fuel efficient eSP engine, SmartKey anti-theft ignition, and spacious under-seat storage.',
                    specifications: JSON.stringify({
                        engine: '109.5cc 4-stroke eSP e-injection',
                        power: '8.8 HP @ 7,500 rpm',
                        fuel_tank: '4.9 Liters (1.8L/100km)',
                        ignition: 'Honda SmartKey Wireless',
                        weight: '96 kg'
                    }),
                    features: JSON.stringify(['SmartKey Wireless Key', 'Idling Stop System', 'USB Charging Port in Glovebox', '2 Included Helmets']),
                    image_url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80',
                    rating: 4.88,
                    total_reviews: 34,
                    total_trips: 112
                },
                {
                    id: 8,
                    name: 'Yamaha Janus',
                    brand: 'Yamaha',
                    model: 'Janus Limited Edition 125cc',
                    category_id: 5,
                    location_id: 5,
                    license_plate: '92-H1 777.77',
                    hourly_rate: 95000.00,
                    daily_rate: 420000.00,
                    weekly_rate: 2400000.00,
                    monthly_rate: 7500000.00,
                    deposit_amount: 1000000.00,
                    status: 'available',
                    vehicle_condition: 'excellent',
                    description: 'Chic European styling paired with a punchy 125cc Blue Core engine. Extremely lightweight, effortless handling, and great fuel economy.',
                    specifications: JSON.stringify({
                        engine: '125cc 4-stroke Blue Core SOHC',
                        power: '9.5 HP @ 8,000 rpm',
                        fuel_tank: '4.2 Liters (1.87L/100km)',
                        starter: 'SmartKey One-push start',
                        weight: '99 kg'
                    }),
                    features: JSON.stringify(['Blue Core High Efficiency', 'SmartKey Keyless System', 'Digital LCD Meter', '2 Helmets & Rain Poncho']),
                    image_url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=900&q=80',
                    rating: 4.82,
                    total_reviews: 21,
                    total_trips: 63
                },
                {
                    id: 9,
                    name: 'Specialized Turbo Vado',
                    brand: 'Specialized',
                    model: 'Turbo Vado 4.0 Step-Through',
                    category_id: 3,
                    location_id: 1,
                    license_plate: 'EBIKE-STV-09',
                    hourly_rate: 80000.00,
                    daily_rate: 380000.00,
                    weekly_rate: 2200000.00,
                    monthly_rate: 6800000.00,
                    deposit_amount: 1500000.00,
                    status: 'available',
                    vehicle_condition: 'excellent',
                    description: 'Smooth, fast, and remarkably quiet electric urban cruiser. 710Wh internal battery delivers up to 140km on a single charge.',
                    specifications: JSON.stringify({
                        motor: 'Specialized 2.0 (70Nm torque)',
                        battery: 'Specialized U2-710, 710Wh',
                        display: 'MasterMind TCD color display',
                        gears: 'SRAM NX 11-speed',
                        brakes: 'SRAM Level hydraulic disc'
                    }),
                    features: JSON.stringify(['Garmin Radar Integration Support', 'Mission Control App Pairing', 'Integrated Front & Rear Lights', 'Step-through Low Frame']),
                    image_url: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=900&q=80',
                    rating: 4.96,
                    total_reviews: 8,
                    total_trips: 22
                },
                {
                    id: 10,
                    name: 'Trek FX 2 Disc',
                    brand: 'Trek',
                    model: 'FX 2 Disc Stagger',
                    category_id: 1,
                    location_id: 3,
                    license_plate: 'BIKE-TFX-10',
                    hourly_rate: 35000.00,
                    daily_rate: 170000.00,
                    weekly_rate: 950000.00,
                    monthly_rate: 2900000.00,
                    deposit_amount: 350000.00,
                    status: 'maintenance',
                    vehicle_condition: 'good',
                    description: 'A stylish, versatile hybrid fitness bike with dependable hydraulic disc brakes and a lightweight Alpha Gold Aluminum frame.',
                    specifications: JSON.stringify({
                        frame: 'Alpha Gold Aluminum, DuoTrap S compatible',
                        drivetrain: 'Shimano Altus 2x9 speed',
                        brakes: 'Tektro HD-R280 hydraulic disc',
                        tires: 'Bontrager H2 Comp, 700x35c',
                        weight: '11.7 kg'
                    }),
                    features: JSON.stringify(['Hydraulic Disc Brakes', 'Internal Cable Routing', 'Ergonomic Fitness Grips', 'Lightweight Alloy Frame']),
                    image_url: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=900&q=80',
                    rating: 4.75,
                    total_reviews: 9,
                    total_trips: 27
                }
            ];

            for (const v of vehicles) {
                await connection.query(`
                    INSERT INTO vehicles (id, name, brand, model, category_id, location_id, license_plate, hourly_rate, daily_rate, weekly_rate, monthly_rate, deposit_amount, status, vehicle_condition, description, specifications, features, image_url, rating, total_reviews, total_trips)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    v.id, v.name, v.brand, v.model, v.category_id, v.location_id, v.license_plate,
                    v.hourly_rate, v.daily_rate, v.weekly_rate, v.monthly_rate, v.deposit_amount,
                    v.status, v.vehicle_condition, v.description, v.specifications, v.features,
                    v.image_url, v.rating, v.total_reviews, v.total_trips
                ]);

                // Vehicle image
                await connection.query(`INSERT INTO vehicle_images (vehicle_id, image_url, is_primary) VALUES (?, ?, TRUE)`, [v.id, v.image_url]);
            }

            // 5. System Settings
            await connection.query(`
                INSERT INTO system_settings (setting_key, setting_value, description) VALUES
                ('late_fee_per_hour', '50000', 'Hourly penalty fee for overdue returns in VND'),
                ('deposit_percentage', '0', 'Deposit percentage if dynamic (0 means using vehicle fixed deposit)'),
                ('cancellation_free_hours', '24', 'Hours before pickup for 100% free cancellation'),
                ('cancellation_fee_percentage', '15', 'Cancellation penalty percentage within 24h'),
                ('company_name', 'RideNow Vietnam Ltd.', 'Official business name'),
                ('support_email', 'support@ridenow.com', 'Customer service email'),
                ('support_phone', '+84 905 123 456', 'Customer hotline'),
                ('business_address', '120 Nguyen Van Linh, Hai Chau, Da Nang', 'Headquarters address')
            `);

            // 6. Sample Bookings, Payments, Deposits
            // Completed Booking
            await connection.query(`
                INSERT INTO bookings (id, booking_code, user_id, vehicle_id, pickup_location_id, return_location_id, pickup_datetime, return_datetime, actual_pickup_datetime, actual_return_datetime, rental_type, duration_hours, rental_fee, deposit_amount, discount_amount, extension_fee, additional_charges, late_fee, damage_fee, total_amount, payment_status, booking_status, notes)
                VALUES (1, 'RN-2026-0001', 2, 1, 1, 1, '2026-11-01 08:00:00', '2026-11-03 18:00:00', '2026-11-01 08:15:00', '2026-11-03 17:45:00', 'daily', 58, 500000.00, 500000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 500000.00, 'paid', 'completed', 'Weekend scenic coastal tour to Son Tra')
            `);

            await connection.query(`
                INSERT INTO payments (transaction_code, booking_id, user_id, amount, payment_type, payment_method, payment_status, transaction_reference, notes) VALUES
                ('TX-RN-0001-RENT', 1, 2, 500000.00, 'rental_fee', 'mock_card', 'paid', 'SIMULATED-AUTH-778899', 'Demo simulated card payment for rental fee'),
                ('TX-RN-0001-DEP', 1, 2, 500000.00, 'deposit', 'mock_card', 'paid', 'SIMULATED-AUTH-778898', 'Demo simulated card authorization for deposit')
            `);

            await connection.query(`
                INSERT INTO deposits (booking_id, user_id, amount, status, refunded_amount, deducted_amount, refund_transaction_id)
                VALUES (1, 2, 500000.00, 'refunded', 500000.00, 0.00, 'TX-REF-0001')
            `);

            await connection.query(`
                INSERT INTO rental_returns (booking_id, vehicle_id, processed_by_user_id, scheduled_return_datetime, actual_return_datetime, is_late, late_hours, late_fee, inspection_condition, return_notes, next_vehicle_status)
                VALUES (1, 1, 1, '2026-11-03 18:00:00', '2026-11-03 17:45:00', FALSE, 0, 0.00, 'excellent', 'Returned clean and on time. Deposit fully refunded.', 'available')
            `);

            await connection.query(`
                INSERT INTO reviews (booking_id, vehicle_id, user_id, rating, comment)
                VALUES (1, 1, 2, 5, 'The Trek Marlin 5 was in pristine condition! Smooth gears, responsive brakes, and pickup at Nguyen Van Linh station was lightning fast. Highly recommended!')
            `);

            // Active Booking
            await connection.query(`
                INSERT INTO bookings (id, booking_code, user_id, vehicle_id, pickup_location_id, return_location_id, pickup_datetime, return_datetime, actual_pickup_datetime, rental_type, duration_hours, rental_fee, deposit_amount, total_amount, payment_status, booking_status, notes)
                VALUES (2, 'RN-2026-0002', 2, 4, 2, 2, '2026-11-05 09:00:00', '2026-11-08 18:00:00', '2026-11-05 09:10:00', 'daily', 81, 900000.00, 1000000.00, 900000.00, 'paid', 'active', 'Electric scooter for coastal city trips')
            `);

            await connection.query(`
                INSERT INTO payments (transaction_code, booking_id, user_id, amount, payment_type, payment_method, payment_status, transaction_reference, notes) VALUES
                ('TX-RN-0002-RENT', 2, 2, 900000.00, 'rental_fee', 'mock_momo', 'paid', 'SIMULATED-MOMO-123456', 'Demo simulated MoMo e-wallet payment'),
                ('TX-RN-0002-DEP', 2, 2, 1000000.00, 'deposit', 'mock_momo', 'paid', 'SIMULATED-MOMO-123457', 'Demo simulated MoMo deposit hold')
            `);

            await connection.query(`
                INSERT INTO deposits (booking_id, user_id, amount, status)
                VALUES (2, 2, 1000000.00, 'held')
            `);

            // Update vehicle 4 operational status to rented
            await connection.query(`UPDATE vehicles SET status = 'rented' WHERE id = 4`);

            // Pending Booking (Customer 3 booked vehicle 7)
            await connection.query(`
                INSERT INTO bookings (id, booking_code, user_id, vehicle_id, pickup_location_id, return_location_id, pickup_datetime, return_datetime, rental_type, duration_hours, rental_fee, deposit_amount, total_amount, payment_status, booking_status, notes)
                VALUES (3, 'RN-2026-0003', 3, 7, 1, 1, '2026-11-10 08:00:00', '2026-11-12 18:00:00', 'daily', 58, 900000.00, 1000000.00, 900000.00, 'pending', 'pending', 'Weekend trip to Hoi An')
            `);

            await connection.query(`
                INSERT INTO deposits (booking_id, user_id, amount, status)
                VALUES (3, 3, 1000000.00, 'held')
            `);

            // 7. Maintenance Log for Vehicle 10
            await connection.query(`
                INSERT INTO vehicle_maintenance (vehicle_id, maintenance_type, scheduled_date, status, cost, description, performed_by, notes)
                VALUES (10, 'Brake Pad Replacement & Gear Tuning', '2026-11-06', 'in_progress', 220000.00, 'Routine 500km maintenance checkup. Replacing rear brake pads and derailleur adjustment.', 'Da Nang Bike Workshop', 'Vehicle temporarily marked as Maintenance')
            `);

            // 8. Notifications
            await connection.query(`
                INSERT INTO notifications (user_id, title, message, type, is_read, link_url) VALUES
                (2, 'Booking Confirmed!', 'Your booking RN-2026-0002 for Xiaomi Electric Scooter 4 is currently active. Return deadline: Nov 08, 18:00.', 'booking', FALSE, '/customer/active-rentals'),
                (2, 'Payment Received (Simulated)', 'Demo payment of 900,000 VND for booking RN-2026-0002 has been processed.', 'payment', TRUE, '/customer/payment-history'),
                (3, 'Booking Submitted', 'Your booking request RN-2026-0003 for Honda Vision is pending Administrator approval.', 'booking', FALSE, '/customer/my-bookings')
            `);

            // 9. Audit Logs
            await connection.query(`
                INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES
                (1, 'SYSTEM_INIT', 'DATABASE', 'ALL', '{"message": "RideNow database initialized with sample dataset"}', '127.0.0.1'),
                (1, 'BOOKING_HANDOVER', 'BOOKINGS', '2', '{"booking_code": "RN-2026-0002", "action": "Vehicle handed over to customer"}', '127.0.0.1')
            `);

            console.log('✓ Initial seed data successfully inserted.');
        } else {
            console.log('Database already has users; skipping seed data to preserve state.');
        }

        console.log('✓ Database initialization finished successfully.');
    } catch (err) {
        console.error('Database initialization error:', err);
        throw err;
    } finally {
        await connection.end();
    }
}

if (require.main === module) {
    initDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = initDatabase;
