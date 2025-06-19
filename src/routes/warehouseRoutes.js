// src/routes/warehouseRoutes.js - RUTAS WAREHOUSE CON MYSQL
const express = require('express');
const router = express.Router();
const WarehouseController = require('../controllers/warehouseController');

console.log('📦 Cargando rutas WHR con MySQL...');

// ============================================
// RUTAS PRINCIPALES WHR - MYSQL
// ============================================

// 🏥 Health Check
router.get('/health', WarehouseController.healthCheck);

// 📊 Estadísticas WHR
router.get('/stats', WarehouseController.getWHRStats);

// 📦 WHR Management
router.post('/whr', WarehouseController.createWHR);
router.get('/whr', WarehouseController.getWHRList);

// 🏷️ Clasificación WHR
router.put('/whr/:id/classify', WarehouseController.classifyWHR);

// 📧 Email WHR
router.post('/whr/:id/email', WarehouseController.sendWHREmail);

// 🗑️ Eliminar WHR
router.delete('/whr/:id', WarehouseController.deleteWHR);

// ============================================
// RUTAS DE TESTING Y DEBUG
// ============================================

// 🧪 Test endpoint
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Módulo Operativo WHR funcionando con MySQL',
        timestamp: new Date().toISOString(),
        database: 'MySQL Connected',
        version: '2.0.0'
    });
});

// 📊 Database export (para testing)
router.get('/database-export', async (req, res) => {
    try {
        const { executeQuery } = require('../config/database');
        const result = await executeQuery('SELECT * FROM whr_packages ORDER BY created_at DESC LIMIT 10');
        
        res.json({
            success: true,
            data: result.data,
            total: result.data.length,
            message: 'Database export exitoso'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error exportando base de datos',
            error: error.message
        });
    }
});

// ============================================
// RUTAS DE COMPATIBILIDAD (LEGACY)
// ============================================

// Mantener compatibilidad con rutas anteriores
router.get('/camca/stats', WarehouseController.getWHRStats);
router.post('/camca/whr', WarehouseController.createWHR);
router.get('/camca/whr', WarehouseController.getWHRList);

console.log('✅ Rutas WHR MySQL cargadas exitosamente');
console.log('📍 Endpoints disponibles:');
console.log('   GET  /api/warehouse/health');
console.log('   GET  /api/warehouse/stats');
console.log('   GET  /api/warehouse/whr');
console.log('   POST /api/warehouse/whr');
console.log('   PUT  /api/warehouse/whr/:id/classify');
console.log('   POST /api/warehouse/whr/:id/email');
console.log('   DELETE /api/warehouse/whr/:id');
console.log('   GET  /api/warehouse/test');

module.exports = router;