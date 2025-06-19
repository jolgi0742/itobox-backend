const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  getUnreadCount
} = require('../controllers/notificationController');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas para obtener notificaciones
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);

// Rutas para marcar como leídas
router.patch('/:id/read', markAsRead);
router.patch('/mark-all-read', markAllAsRead);

// Rutas para eliminar
router.delete('/:id', deleteNotification);

// Rutas para admin/agent crear notificaciones
router.post('/', authorize('admin', 'agent'), createNotification);

module.exports = router;