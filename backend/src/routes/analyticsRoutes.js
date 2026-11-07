const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

router.get('/dashboard', requireAuth, requireAdmin, analyticsController.getDashboardAnalytics);

module.exports = router;
