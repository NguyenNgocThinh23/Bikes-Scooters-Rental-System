const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

router.get('/all', requireAuth, requireAdmin, maintenanceController.getMaintenanceLogs);
router.post('/schedule', requireAuth, requireAdmin, maintenanceController.scheduleMaintenance);
router.post('/:id/complete', requireAuth, requireAdmin, maintenanceController.completeMaintenance);

module.exports = router;
