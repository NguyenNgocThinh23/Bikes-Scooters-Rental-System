const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

router.post('/', requireAuth, bookingController.createBooking);
router.get('/my-bookings', requireAuth, bookingController.getMyBookings);
router.get('/all', requireAuth, requireAdmin, bookingController.getAllBookings);
router.get('/:id', requireAuth, bookingController.getBookingById);
router.post('/:id/cancel', requireAuth, bookingController.cancelBooking);
router.post('/:id/confirm', requireAuth, requireAdmin, bookingController.confirmBooking);
router.post('/:id/reject', requireAuth, requireAdmin, bookingController.rejectBooking);

module.exports = router;
