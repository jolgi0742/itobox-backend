const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');
const {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getClientPackages,
  getClientProfile
} = require('../controllers/clientController');

const router = express.Router();

// Rutas públicas
router.get('/', authMiddleware, authorize('admin', 'agent'), getClients);
router.get('/:id', authMiddleware, authorize('admin', 'agent'), getClient);

// Rutas protegidas para admin/agent
router.post('/', authMiddleware, authorize('admin', 'agent'), createClient);
router.patch('/:id', authMiddleware, authorize('admin', 'agent'), updateClient);
router.delete('/:id', authMiddleware, authorize('admin'), deleteClient);

// Rutas para clientes
router.get('/:id/packages', authMiddleware, getClientPackages);
router.get('/profile/me', authMiddleware, authorize('client'), getClientProfile);

module.exports = router;