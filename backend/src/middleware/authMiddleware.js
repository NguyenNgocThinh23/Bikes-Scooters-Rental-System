const { verifyToken } = require('../config/jwt');
const { query } = require('../config/db');

async function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Authentication required. Missing or invalid Bearer token.' });
        }

        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
        }

        const users = await query('SELECT id, full_name, email, phone, address, role, status, document_verification_status, document_rejection_reason FROM users WHERE id = ?', [decoded.id]);
        if (!users || users.length === 0) {
            return res.status(401).json({ success: false, message: 'User account not found.' });
        }

        const user = users[0];
        if (user.status !== 'active') {
            return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact support.' });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(500).json({ success: false, message: 'Internal authentication error.' });
    }
}

function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Forbidden. Administrator privileges required.' });
    }
    next();
}

async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = verifyToken(token);
                const users = await query('SELECT id, full_name, email, role, status FROM users WHERE id = ?', [decoded.id]);
                if (users.length > 0 && users[0].status === 'active') {
                    req.user = users[0];
                }
            } catch (ignore) {}
        }
    } catch (ignore) {}
    next();
}

module.exports = {
    requireAuth,
    requireAdmin,
    optionalAuth
};
