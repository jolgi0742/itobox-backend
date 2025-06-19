const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');
const {
  getDashboardStats,
  getAdminDashboard,
  getAgentDashboard,
  getClientDashboard,
  getRecentActivity,
  getChartData
} = require('../controllers/dashboardController');

const router = express.Router();

// Rutas protegidas - requieren autenticación
router.get('/stats', authMiddleware, getDashboardStats);
router.get('/activity', authMiddleware, getRecentActivity);
router.get('/charts/:type', authMiddleware, getChartData);

// Rutas específicas por rol
router.get('/admin', authMiddleware, authorize('admin'), getAdminDashboard);
router.get('/agent', authMiddleware, authorize('admin', 'agent'), getAgentDashboard);
router.get('/client', authMiddleware, authorize('client'), getClientDashboard);

module.exports = router;