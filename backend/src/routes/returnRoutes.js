const express = require('express');
const router = express.Router();
const returnController = require('../controllers/returnController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

router.post('/pickup', requireAuth, requireAdmin, returnController.processPickup);
router.post('/return', requireAuth, requireAdmin, returnController.processReturn);

module.exports = router;
