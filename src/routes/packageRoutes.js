const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');
const {
  getPackages,
  getPackage,
  createPackage,
  updatePackage,
  deletePackage
} = require('../controllers/packageController');

const router = express.Router();

// Rutas públicas
router.get('/', getPackages);
router.get('/:id', getPackage);

// Rutas protegidas
router.post('/', authMiddleware, authorize('admin', 'agent'), createPackage);
router.patch('/:id', authMiddleware, authorize('admin', 'agent'), updatePackage);
router.delete('/:id', authMiddleware, authorize('admin'), deletePackage);

module.exports = router;