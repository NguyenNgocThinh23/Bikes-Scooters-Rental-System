const path = require('path');
const fs = require('fs');
const { query } = require('../config/db');
const { validateMagicBytes, uploadDir } = require('../middleware/uploadMiddleware');
const { createNotification, notifyAdmins } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');

/**
 * Customer: Upload ID / Driver's license document for verification
 */
async function uploadVerificationDocument(req, res, next) {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No document file was uploaded.' });
        }

        // Validate actual file magic bytes to verify content integrity
        const isValidSignature = validateMagicBytes(req.file.path);
        if (!isValidSignature) {
            // Delete corrupt or spoofed file immediately
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'Invalid document content. File signature does not match allowed JPG, PNG, or PDF format.'
            });
        }

        // Clean up previous document if one existed
        const users = await query('SELECT id_document_filename FROM users WHERE id = ?', [req.user.id]);
        if (users.length > 0 && users[0].id_document_filename) {
            const oldPath = path.join(uploadDir, users[0].id_document_filename);
            if (fs.existsSync(oldPath)) {
                try { fs.unlinkSync(oldPath); } catch (e) {}
            }
        }

        await query(`
            UPDATE users SET
                id_document_filename = ?,
                id_document_mimetype = ?,
                id_document_original_name = ?,
                document_verification_status = 'pending',
                document_rejection_reason = NULL
            WHERE id = ?
        `, [req.file.filename, req.file.mimetype, req.file.originalname, req.user.id]);

        await notifyAdmins({
            title: 'Customer Document Uploaded',
            message: `Customer ${req.user.full_name} uploaded identity verification document. Status: Pending review.`,
            type: 'verification',
            linkUrl: `/admin/customers`
        });

        await logAudit({
            userId: req.user.id,
            action: 'DOCUMENT_UPLOAD',
            entityType: 'USERS',
            entityId: req.user.id,
            details: { filename: req.file.filename, size: req.file.size, mimetype: req.file.mimetype },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Document uploaded successfully! It is now pending administrator verification.',
            document_verification_status: 'pending'
        });
    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (e) {}
        }
        next(err);
    }
}

/**
 * Secure document retrieval by User ID (strictly authenticated & authorized)
 */
async function getVerificationDocument(req, res, next) {
    try {
        const targetUserId = parseInt(req.params.userId, 10);

        // Security check: only admin or the document owner
        if (req.user.role !== 'admin' && req.user.id !== targetUserId) {
            return res.status(403).json({ success: false, message: 'Access forbidden. You cannot view other users documents.' });
        }

        const users = await query(
            'SELECT id_document_filename, id_document_mimetype, id_document_original_name FROM users WHERE id = ?',
            [targetUserId]
        );

        if (users.length === 0 || !users[0].id_document_filename) {
            return res.status(404).json({ success: false, message: 'No verification document found for this user.' });
        }

        const userDoc = users[0];
        const filePath = path.join(uploadDir, userDoc.id_document_filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'Document file not found on disk.' });
        }

        res.setHeader('Content-Type', userDoc.id_document_mimetype || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(userDoc.id_document_original_name || 'document')}"`);
        res.sendFile(filePath);
    } catch (err) {
        next(err);
    }
}

/**
 * Admin: Get all customers with search and filter
 */
async function getAllCustomers(req, res, next) {
    try {
        const { search, status, verification_status } = req.query;

        let sql = `
            SELECT u.id, u.full_name, u.email, u.phone, u.address, u.role, u.status,
                   u.document_verification_status, u.document_rejection_reason,
                   u.id_document_filename IS NOT NULL as has_document,
                   u.created_at,
                   (SELECT COUNT(*) FROM bookings b WHERE b.user_id = u.id) as total_bookings,
                   (SELECT COALESCE(SUM(b.total_amount), 0) FROM bookings b WHERE b.user_id = u.id AND b.booking_status = 'completed') as total_spent
            FROM users u
            WHERE u.role = 'customer'
        `;
        const params = [];

        if (status) {
            sql += ' AND u.status = ?';
            params.push(status);
        }

        if (verification_status) {
            sql += ' AND u.document_verification_status = ?';
            params.push(verification_status);
        }

        if (search) {
            sql += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term);
        }

        sql += ' ORDER BY u.id DESC';

        const customers = await query(sql, params);
        res.json({ success: true, count: customers.length, data: customers });
    } catch (err) {
        next(err);
    }
}

/**
 * Admin: Get customer details by ID
 */
async function getCustomerById(req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);
        const users = await query(`
            SELECT id, full_name, email, phone, address, role, status,
                   document_verification_status, document_rejection_reason,
                   id_document_filename IS NOT NULL as has_document,
                   id_document_original_name, id_document_mimetype,
                   created_at
            FROM users WHERE id = ? AND role = 'customer'
        `, [id]);

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer not found.' });
        }

        const customer = users[0];

        // Fetch bookings
        const bookings = await query(`
            SELECT b.*, v.name as vehicle_name
            FROM bookings b
            JOIN vehicles v ON b.vehicle_id = v.id
            WHERE b.user_id = ?
            ORDER BY b.id DESC
        `, [id]);

        // Fetch payments
        const payments = await query(`
            SELECT p.*, b.booking_code
            FROM payments p
            JOIN bookings b ON p.booking_id = b.id
            WHERE p.user_id = ?
            ORDER BY p.id DESC
        `, [id]);

        res.json({
            success: true,
            data: {
                ...customer,
                bookings,
                payments
            }
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Admin: Approve or Reject customer verification document
 */
async function verifyCustomerDocument(req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);
        const { status, rejection_reason } = req.body;

        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: "Status must be either 'approved' or 'rejected'." });
        }

        if (status === 'rejected' && (!rejection_reason || rejection_reason.trim().length === 0)) {
            return res.status(400).json({ success: false, message: 'Rejection reason is required when rejecting a document.' });
        }

        const users = await query('SELECT full_name, email FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer not found.' });
        }

        await query(`
            UPDATE users SET
                document_verification_status = ?,
                document_rejection_reason = ?
            WHERE id = ?
        `, [status, status === 'rejected' ? rejection_reason.trim() : null, id]);

        await createNotification({
            userId: id,
            title: status === 'approved' ? 'Identity Document Approved' : 'Identity Document Rejected',
            message: status === 'approved'
                ? 'Your ID verification document has been approved by the administrator. You are all set to rent vehicles!'
                : `Your document verification was rejected. Reason: ${rejection_reason}. Please upload a clear photo or scan.`,
            type: 'verification',
            linkUrl: `/customer/profile`
        });

        await logAudit({
            userId: req.user.id,
            action: status === 'approved' ? 'DOCUMENT_APPROVE' : 'DOCUMENT_REJECT',
            entityType: 'USERS',
            entityId: id,
            details: { status, rejection_reason },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: `Customer document verification status updated to ${status}.`
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Admin: Activate or deactivate customer account
 */
async function toggleCustomerStatus(req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);
        const { status } = req.body;

        if (!status || !['active', 'inactive'].includes(status)) {
            return res.status(400).json({ success: false, message: "Status must be 'active' or 'inactive'." });
        }

        await query('UPDATE users SET status = ? WHERE id = ? AND role = "customer"', [status, id]);

        await logAudit({
            userId: req.user.id,
            action: 'CUSTOMER_STATUS_CHANGE',
            entityType: 'USERS',
            entityId: id,
            details: { status },
            ipAddress: req.ip
        });

        res.json({ success: true, message: `Customer account is now ${status}.` });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    uploadVerificationDocument,
    getVerificationDocument,
    getAllCustomers,
    getCustomerById,
    verifyCustomerDocument,
    toggleCustomerStatus
};
