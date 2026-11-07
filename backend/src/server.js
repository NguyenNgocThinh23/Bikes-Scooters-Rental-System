require('dotenv').config();
const app = require('./app');
const { pool } = require('./config/db');

const PORT = parseInt(process.env.PORT, 10) || 5000;

async function startServer() {
    try {
        // Test database connectivity
        const [rows] = await pool.query('SELECT 1 + 1 as result');
        console.log('✓ Connected to MySQL database successfully.');

        app.listen(PORT, () => {
            console.log(`===============================================`);
            console.log(` RideNow Backend API Server running on port ${PORT}`);
            console.log(` Health check: http://localhost:${PORT}/api/health`);
            console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`===============================================`);
        });
    } catch (err) {
        console.error('Failed to start server due to database connection error:', err);
        process.exit(1);
    }
}

startServer();
