const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { signToken } = require('../config/jwt');
const { logAudit } = require('../services/auditService');

async function register(req, res, next) {
    try {
        const { full_name, email, password, phone, address } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existing = await query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const result = await query(
            `INSERT INTO users (full_name, email, password_hash, phone, address, role, status, document_verification_status)
             VALUES (?, ?, ?, ?, ?, 'customer', 'active', 'pending')`,
            [full_name.trim(), normalizedEmail, password_hash, phone || null, address || null]
        );

        const newUserId = result.insertId;
        const token = signToken({ id: newUserId, email: normalizedEmail, role: 'customer' });

        await logAudit({
            userId: newUserId,
            action: 'USER_REGISTER',
            entityType: 'USERS',
            entityId: newUserId,
            details: { email: normalizedEmail, full_name },
            ipAddress: req.ip
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful! Welcome to RideNow.',
            token,
            user: {
                id: newUserId,
                full_name,
                email: normalizedEmail,
                phone,
                address,
                role: 'customer',
                document_verification_status: 'pending'
            }
        });
    } catch (err) {
        next(err);
    }
}

async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const users = await query('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const user = users[0];
        if (user.status !== 'active') {
            return res.status(403).json({ success: false, message: 'Your account is deactivated. Please contact support.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = signToken({ id: user.id, email: user.email, role: user.role });

        await logAudit({
            userId: user.id,
            action: 'USER_LOGIN',
            entityType: 'USERS',
            entityId: user.id,
            details: { email: user.email, role: user.role },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Login successful.',
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role,
                status: user.status,
                document_verification_status: user.document_verification_status,
                document_rejection_reason: user.document_rejection_reason
            }
        });
    } catch (err) {
        next(err);
    }
}

async function getProfile(req, res, next) {
    try {
        const users = await query(
            `SELECT id, full_name, email, phone, address, role, status, 
                    document_verification_status, document_rejection_reason, 
                    id_document_filename, created_at
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const user = users[0];
        res.json({
            success: true,
            user: {
                ...user,
                has_document: !!user.id_document_filename
            }
        });
    } catch (err) {
        next(err);
    }
}

async function updateProfile(req, res, next) {
    try {
        const { full_name, phone, address } = req.body;
        if (!full_name || full_name.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Full name cannot be empty.' });
        }

        await query(
            'UPDATE users SET full_name = ?, phone = ?, address = ? WHERE id = ?',
            [full_name.trim(), phone || null, address || null, req.user.id]
        );

        res.json({
            success: true,
            message: 'Profile updated successfully.',
            user: {
                id: req.user.id,
                full_name: full_name.trim(),
                phone: phone || null,
                address: address || null
            }
        });
    } catch (err) {
        next(err);
    }
}

async function changePassword(req, res, next) {
    try {
        const { current_password, new_password } = req.body;
        if (!current_password || !new_password) {
            return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
        }

        if (new_password.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
        }

        const users = await query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
        const isMatch = await bcrypt.compare(current_password, users[0].password_hash);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Incorrect current password.' });
        }

        const newHash = await bcrypt.hash(new_password, 10);
        await query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

        await logAudit({
            userId: req.user.id,
            action: 'PASSWORD_CHANGE',
            entityType: 'USERS',
            entityId: req.user.id,
            ipAddress: req.ip
        });

        res.json({ success: true, message: 'Password changed successfully.' });
    } catch (err) {
        next(err);
    }
}

async function forgotPassword(req, res, next) {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required.' });
        }

        // Simulated password reset instructions
        res.json({
            success: true,
            message: 'If an account exists with this email, password reset instructions have been dispatched.'
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    forgotPassword
};
