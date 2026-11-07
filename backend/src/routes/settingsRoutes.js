const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', settingsController.getSettings);
router.put('/:key', requireAuth, requireAdmin, settingsController.updateSetting);
router.get('/audit-logs/all', requireAuth, requireAdmin, settingsController.getAuditLogs);

module.exports = router;
