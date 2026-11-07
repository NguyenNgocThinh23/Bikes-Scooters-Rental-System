const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

router.post('/process', requireAuth, paymentController.processPayment);
router.get('/my-history', requireAuth, paymentController.getMyPaymentHistory);
router.get('/all', requireAuth, requireAdmin, paymentController.getAllPayments);
router.get('/invoice/:bookingId', requireAuth, paymentController.getInvoiceData);

module.exports = router;
