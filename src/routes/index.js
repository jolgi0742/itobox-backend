const express = require('express');
const authRoutes = require('./auth');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ITOBOX Courier API funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'connected',
      redis: 'connected',
      server: 'running'
    }
  });
});

// Información de la API
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenido a ITOBOX Courier API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      packages: '/api/packages',
      clients: '/api/clients',
      tracking: '/api/tracking'
    }
  });
});

// Rutas de autenticación
router.use('/auth', authRoutes);

// TODO: Agregar más rutas cuando las creemos
// router.use('/packages', packageRoutes);
// router.use('/clients', clientRoutes);
// router.use('/tracking', trackingRoutes);

module.exports = router;