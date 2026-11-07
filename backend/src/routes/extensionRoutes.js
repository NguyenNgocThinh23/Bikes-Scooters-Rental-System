const express = require('express');
const router = express.Router();
const extensionController = require('../controllers/extensionController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

router.post('/request', requireAuth, extensionController.requestExtension);
router.get('/all', requireAuth, requireAdmin, extensionController.getAllExtensions);
router.post('/:id/approve', requireAuth, requireAdmin, extensionController.approveExtension);
router.post('/:id/reject', requireAuth, requireAdmin, extensionController.rejectExtension);

module.exports = router;
