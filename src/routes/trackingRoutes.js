const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');
const {
  trackPackage,
  getTrackingHistory,
  updateTrackingStatus,
  getPublicTracking,
  addTrackingEvent
} = require('../controllers/trackingController');

const router = express.Router();

// Rutas públicas
router.get('/public/:trackingNumber', getPublicTracking);

// Rutas protegidas
router.get('/:packageId', authMiddleware, trackPackage);
router.get('/:packageId/history', authMiddleware, getTrackingHistory);

// Rutas para admin/agent
router.post('/:packageId/status', authMiddleware, authorize('admin', 'agent'), updateTrackingStatus);
router.post('/:packageId/event', authMiddleware, authorize('admin', 'agent'), addTrackingEvent);

module.exports = router;