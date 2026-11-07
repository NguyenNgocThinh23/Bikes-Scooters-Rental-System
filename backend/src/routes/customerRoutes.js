const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

// Customer document upload
router.post('/upload-document', requireAuth, upload.single('document'), customerController.uploadVerificationDocument);

// Secure document retrieval by User ID (Authorized: Owner or Admin)
router.get('/:userId/document', requireAuth, customerController.getVerificationDocument);

// Admin customer management routes
router.get('/all', requireAuth, requireAdmin, customerController.getAllCustomers);
router.get('/:id', requireAuth, requireAdmin, customerController.getCustomerById);
router.post('/:id/verify-document', requireAuth, requireAdmin, customerController.verifyCustomerDocument);
router.post('/:id/status', requireAuth, requireAdmin, customerController.toggleCustomerStatus);

module.exports = router;
