const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', vehicleController.getVehicles);
router.get('/categories', vehicleController.getCategories);
router.get('/locations', vehicleController.getLocations);
router.get('/:id', vehicleController.getVehicleById);
router.get('/:id/availability', vehicleController.getVehicleAvailabilityCalendar);

// Admin routes
router.post('/', requireAuth, requireAdmin, vehicleController.createVehicle);
router.put('/:id', requireAuth, requireAdmin, vehicleController.updateVehicle);
router.delete('/:id', requireAuth, requireAdmin, vehicleController.deleteVehicle);

module.exports = router;
