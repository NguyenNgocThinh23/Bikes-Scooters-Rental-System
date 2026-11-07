const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/', reviewController.getReviews);
router.post('/', requireAuth, reviewController.addReview);

module.exports = router;
