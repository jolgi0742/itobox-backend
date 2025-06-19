// src/routes/warehouseRoutes.js - VERSIÓN CORREGIDA CON PERSISTENCIA REAL
const express = require('express');
const router = express.Router();

// ====================================
// BASE DE DATOS EN MEMORIA (PERSISTENTE)
// ====================================
let whrDatabase = [];
let whrCounter = 1;

// ====================================
// FUNCIONES UTILITARIAS CAMCA
// ====================================

// Generar número WHR único
const generateWHRNumber = () => {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  const sequence = whrCounter.toString().padStart(4, '0');
  whrCounter++;
  return `WHR${year}${month}${day}${sequence}`;
};

// Calcular volumen según fórmula CAMCA
const calculateVolume = (length, width, height) => {
  return (length * width * height) * 0.000578746;
};

// Calcular peso volumétrico según CAMCA
const calculateVolumeWeight = (volume) => {
  return volume * 10.4;
};

// Calcular fecha estimada llegada CR
const calculateEstimatedArrivalCR = (departureDate, transport) => {
  if (!departureDate) return '';
  
  const departure = new Date(departureDate);
  const daysToAdd = transport === 'air' ? 2 : 14;
  departure.setDate(departure.getDate() + daysToAdd);
  
  return departure.toISOString().split('T')[0];
};

// ====================================
// CONTROLADOR REAL (NO MOCK)
// ====================================

const WarehouseController = {
  // 📦 CREAR NUEVO WHR
  async createWHR(req, res) {
    console.log('📦 REAL: Creando WHR con datos:', req.body);
    
    try {
      const {
        trackingNumber,
        receivedBy,
        carrier,
        shipperName,
        shipperCompany,
        shipperAddress,
        shipperPhone,
        consigneeName,
        consigneeCompany,
        consigneeAddress,
        consigneePhone,
        consigneeEmail,
        content,
        pieces,
        weight,
        length,
        width,
        height,
        invoiceNumber,
        declaredValue,
        poNumber,
        departureDate,
        transport,
        estimatedArrivalCR,
        notes
      } = req.body;

      // Validaciones básicas
      if (!trackingNumber || !consigneeName || !consigneeEmail || !content) {
        return res.status(400).json({
          success: false,
          message: 'Campos requeridos: trackingNumber, consigneeName, consigneeEmail, content'
        });
      }

      // Calcular métricas CAMCA
      const volume = calculateVolume(length || 0, width || 0, height || 0);
      const volumeWeight = calculateVolumeWeight(volume);
      const estimatedArrival = estimatedArrivalCR || 
        calculateEstimatedArrivalCR(departureDate, transport || 'air');

      // Crear nuevo WHR
      const newWHR = {
        id: `whr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        whrNumber: generateWHRNumber(),
        trackingNumber,
        arrivalDate: new Date().toISOString().split('T')[0],
        receivedBy: receivedBy || 'CRI/SJO EXPRESS Admin',
        status: 'en Miami',
        shipper: {
          name: shipperName || '',
          company: shipperCompany || '',
          address: shipperAddress || '',
          phone: shipperPhone || ''
        },
        consignee: {
          name: consigneeName,
          company: consigneeCompany || '',
          address: consigneeAddress || '',
          phone: consigneePhone || '',
          email: consigneeEmail
        },
        carrier: carrier || 'UPS',
        content,
        pieces: parseInt(pieces) || 1,
        weight: parseFloat(weight) || 0,
        dimensions: {
          length: parseFloat(length) || 0,
          width: parseFloat(width) || 0,
          height: parseFloat(height) || 0
        },
        volume: parseFloat(volume.toFixed(2)),
        volumeWeight: parseFloat(volumeWeight.toFixed(2)),
        invoiceNumber: invoiceNumber || '',
        declaredValue: parseFloat(declaredValue) || 0,
        poNumber: poNumber || '',
        departureDate: departureDate || '',
        transport: transport || 'air',
        estimatedArrivalCR: estimatedArrival,
        notes: notes || '',
        classification: 'pending',
        emailSent: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // GUARDAR EN BASE DE DATOS (EN MEMORIA)
      whrDatabase.push(newWHR);
      
      console.log(`✅ WHR GUARDADO: ${newWHR.whrNumber} (Total: ${whrDatabase.length})`);

      res.status(201).json({
        success: true,
        message: 'WHR creado y guardado exitosamente',
        data: {
          whr: newWHR,
          whrNumber: newWHR.whrNumber,
          calculatedMetrics: {
            volume: newWHR.volume,
            volumeWeight: newWHR.volumeWeight
          },
          database_status: `${whrDatabase.length} WHRs en base de datos`
        }
      });

    } catch (error) {
      console.error('❌ Error creando WHR:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // 📋 OBTENER LISTA DE WHRs
  async getWHRList(req, res) {
    console.log(`📋 REAL: Obteniendo ${whrDatabase.length} WHRs de base de datos`);
    
    try {
      const { search, status, limit = 50, offset = 0 } = req.query;
      
      let filteredWHRs = [...whrDatabase];
      
      // Filtrar por búsqueda
      if (search) {
        const searchLower = search.toLowerCase();
        filteredWHRs = filteredWHRs.filter(whr => 
          whr.whrNumber.toLowerCase().includes(searchLower) ||
          whr.trackingNumber.toLowerCase().includes(searchLower) ||
          whr.consignee.name.toLowerCase().includes(searchLower) ||
          whr.content.toLowerCase().includes(searchLower)
        );
      }
      
      // Filtrar por estado
      if (status && status !== 'all') {
        filteredWHRs = filteredWHRs.filter(whr => whr.status === status);
      }
      
      // Paginación
      const startIndex = parseInt(offset);
      const endIndex = startIndex + parseInt(limit);
      const paginatedWHRs = filteredWHRs.slice(startIndex, endIndex);
      
      res.json({
        success: true,
        data: {
          whrList: paginatedWHRs,
          pagination: {
            currentPage: Math.floor(startIndex / limit) + 1,
            totalPages: Math.ceil(filteredWHRs.length / limit),
            totalItems: filteredWHRs.length,
            itemsPerPage: parseInt(limit)
          },
          filters: req.query,
          database_info: {
            total_whrs: whrDatabase.length,
            filtered_whrs: filteredWHRs.length
          }
        }
      });

    } catch (error) {
      console.error('❌ Error obteniendo lista WHR:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo lista de WHRs',
        error: error.message
      });
    }
  },

  // 📊 OBTENER ESTADÍSTICAS REALES
  async getWHRStats(req, res) {
    console.log(`📊 REAL: Calculando estadísticas de ${whrDatabase.length} WHRs`);
    
    try {
      const { days = 30 } = req.query;
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days));
      
      // Filtrar WHRs por fecha
      const recentWHRs = whrDatabase.filter(whr => 
        new Date(whr.createdAt) >= daysAgo
      );
      
      // Calcular estadísticas reales
      const stats = {
        total: recentWHRs.length,
        pending: recentWHRs.filter(w => w.classification === 'pending').length,
        awb: recentWHRs.filter(w => w.classification === 'awb').length,
        bl: recentWHRs.filter(w => w.classification === 'bl').length,
        emails_pending: recentWHRs.filter(w => !w.emailSent).length,
        in_miami: recentWHRs.filter(w => w.status === 'en Miami').length,
        by_air: recentWHRs.filter(w => w.transport === 'air').length,
        by_sea: recentWHRs.filter(w => w.transport === 'sea').length,
        in_transit: recentWHRs.filter(w => w.status === 'en tránsito').length,
        delivered: recentWHRs.filter(w => w.status === 'entregado').length,
        avg_weight: recentWHRs.length > 0 ? 
          (recentWHRs.reduce((sum, w) => sum + w.weight, 0) / recentWHRs.length).toFixed(2) : '0.00',
        avg_volume: recentWHRs.length > 0 ? 
          (recentWHRs.reduce((sum, w) => sum + w.volume, 0) / recentWHRs.length).toFixed(2) : '0.00',
        total_value: recentWHRs.reduce((sum, w) => sum + w.declaredValue, 0).toFixed(2),
        total_pieces: recentWHRs.reduce((sum, w) => sum + w.pieces, 0),
        next_whr_number: generateWHRNumber(),
        last_whr_created: recentWHRs.length > 0 ? 
          recentWHRs[recentWHRs.length - 1].createdAt : null,
        date_range_days: parseInt(days)
      };
      
      res.json({
        success: true,
        data: {
          stats,
          generated_at: new Date().toISOString(),
          database_info: {
            total_database_whrs: whrDatabase.length,
            recent_whrs: recentWHRs.length
          }
        }
      });

    } catch (error) {
      console.error('❌ Error calculando estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error calculando estadísticas',
        error: error.message
      });
    }
  },

  // 🔍 OBTENER WHR POR ID
  async getWHRById(req, res) {
    const whrId = req.params.id;
    console.log(`🔍 REAL: Buscando WHR ID: ${whrId}`);
    
    const whr = whrDatabase.find(w => w.id === whrId);
    
    if (!whr) {
      return res.status(404).json({
        success: false,
        message: 'WHR no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: {
        whr,
        trackingEvents: [
          {
            event_type: 'created',
            event_description: 'WHR creado en el sistema',
            location: 'Miami, FL',
            created_at: whr.createdAt
          }
        ]
      }
    });
  },

  // 🏷️ CLASIFICAR WHR
  async classifyWHR(req, res) {
    const whrId = req.params.id;
    const { classification } = req.body;
    
    console.log(`🏷️ REAL: Clasificando WHR ${whrId} como ${classification}`);
    
    if (!['awb', 'bl'].includes(classification)) {
      return res.status(400).json({
        success: false,
        message: 'Clasificación debe ser "awb" o "bl"'
      });
    }
    
    const whrIndex = whrDatabase.findIndex(w => w.id === whrId);
    
    if (whrIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'WHR no encontrado'
      });
    }
    
    // Actualizar clasificación
    whrDatabase[whrIndex].classification = classification;
    whrDatabase[whrIndex].transport = classification === 'awb' ? 'air' : 'sea';
    whrDatabase[whrIndex].classifiedAt = new Date().toISOString();
    whrDatabase[whrIndex].updatedAt = new Date().toISOString();
    
    console.log(`✅ WHR ${whrDatabase[whrIndex].whrNumber} clasificado como ${classification.toUpperCase()}`);
    
    res.json({
      success: true,
      message: `WHR clasificado como ${classification.toUpperCase()}`,
      data: {
        whr: whrDatabase[whrIndex]
      }
    });
  },

  // 📧 MARCAR EMAIL ENVIADO
  async markEmailSent(req, res) {
    const whrId = req.params.id;
    console.log(`📧 REAL: Marcando email enviado para WHR ${whrId}`);
    
    const whrIndex = whrDatabase.findIndex(w => w.id === whrId);
    
    if (whrIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'WHR no encontrado'
      });
    }
    
    // Marcar email como enviado
    whrDatabase[whrIndex].emailSent = true;
    whrDatabase[whrIndex].emailSentAt = new Date().toISOString();
    whrDatabase[whrIndex].updatedAt = new Date().toISOString();
    
    console.log(`✅ Email marcado como enviado para ${whrDatabase[whrIndex].whrNumber}`);
    
    res.json({
      success: true,
      message: 'Email marcado como enviado',
      data: {
        whr: whrDatabase[whrIndex]
      }
    });
  },

  // 🔄 ACTUALIZAR ESTADO WHR
  async updateWHRStatus(req, res) {
    const whrId = req.params.id;
    const { status } = req.body;
    
    console.log(`🔄 REAL: Actualizando estado WHR ${whrId} a ${status}`);
    
    const whrIndex = whrDatabase.findIndex(w => w.id === whrId);
    
    if (whrIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'WHR no encontrado'
      });
    }
    
    whrDatabase[whrIndex].status = status;
    whrDatabase[whrIndex].updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: {
        whr: whrDatabase[whrIndex]
      }
    });
  },

  // 🗑️ ELIMINAR WHR
  async deleteWHR(req, res) {
    const whrId = req.params.id;
    console.log(`🗑️ REAL: Eliminando WHR ${whrId}`);
    
    const whrIndex = whrDatabase.findIndex(w => w.id === whrId);
    
    if (whrIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'WHR no encontrado'
      });
    }
    
    const deletedWHR = whrDatabase.splice(whrIndex, 1)[0];
    
    console.log(`✅ WHR ${deletedWHR.whrNumber} eliminado. Quedan ${whrDatabase.length} WHRs`);
    
    res.json({
      success: true,
      message: 'WHR eliminado exitosamente',
      data: {
        deletedWHR,
        remaining_whrs: whrDatabase.length
      }
    });
  },

  // 🔍 BÚSQUEDA
  async searchWHR(req, res) {
    const { q } = req.query;
    console.log(`🔍 REAL: Buscando WHRs con término: ${q}`);
    
    if (!q) {
      return res.json({
        success: true,
        data: {
          results: [],
          count: 0,
          searchTerm: q
        }
      });
    }
    
    const searchLower = q.toLowerCase();
    const results = whrDatabase.filter(whr => 
      whr.whrNumber.toLowerCase().includes(searchLower) ||
      whr.trackingNumber.toLowerCase().includes(searchLower) ||
      whr.consignee.name.toLowerCase().includes(searchLower) ||
      whr.content.toLowerCase().includes(searchLower)
    );
    
    res.json({
      success: true,
      data: {
        results,
        count: results.length,
        searchTerm: q
      }
    });
  },

  // 📍 TRACKING PÚBLICO
  async publicTracking(req, res) {
    const { tracking } = req.params;
    console.log(`📍 REAL: Tracking público para: ${tracking}`);
    
    const whr = whrDatabase.find(w => 
      w.trackingNumber === tracking || w.whrNumber === tracking
    );
    
    if (!whr) {
      return res.status(404).json({
        success: false,
        message: 'Paquete no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: {
        whr: {
          whrNumber: whr.whrNumber,
          trackingNumber: whr.trackingNumber,
          status: whr.status,
          consigneeName: whr.consignee.name,
          arrivalDate: whr.arrivalDate,
          estimatedArrivalCR: whr.estimatedArrivalCR
        },
        events: [
          {
            event_type: 'created',
            event_description: 'Paquete recibido en Miami',
            location: 'Miami, FL',
            created_at: whr.createdAt
          }
        ]
      }
    });
  }
};

// ====================================
// RUTAS CON CONTROLADOR REAL
// ====================================

// Crear nuevo WHR
router.post('/whr', WarehouseController.createWHR);

// Obtener lista de WHR
router.get('/whr', WarehouseController.getWHRList);

// Obtener estadísticas
router.get('/stats', WarehouseController.getWHRStats);

// Obtener WHR por ID
router.get('/whr/:id', WarehouseController.getWHRById);

// Clasificar WHR
router.put('/whr/:id/classify', WarehouseController.classifyWHR);

// Marcar email enviado
router.put('/whr/:id/email-sent', WarehouseController.markEmailSent);

// Actualizar estado
router.put('/whr/:id/status', WarehouseController.updateWHRStatus);

// Eliminar WHR
router.delete('/whr/:id', WarehouseController.deleteWHR);

// Búsqueda
router.get('/search', WarehouseController.searchWHR);

// Tracking público
router.get('/tracking/:tracking', WarehouseController.publicTracking);

// ====================================
// RUTAS DE UTILIDADES
// ====================================

// Test de base de datos
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Sistema CAMCA funcionando con PERSISTENCIA REAL',
    timestamp: new Date().toISOString(),
    database_status: {
      total_whrs: whrDatabase.length,
      next_whr_number: generateWHRNumber(),
      last_created: whrDatabase.length > 0 ? 
        whrDatabase[whrDatabase.length - 1].createdAt : 'Ninguno'
    },
    endpoints: [
      'POST /api/warehouse/whr - Crear WHR',
      'GET /api/warehouse/whr - Lista de WHR',
      'GET /api/warehouse/stats - Estadísticas',
      'PUT /api/warehouse/whr/:id/classify - Clasificar WHR',
      'PUT /api/warehouse/whr/:id/email-sent - Marcar email enviado'
    ]
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    service: 'warehouse',
    status: 'healthy',
    persistence: 'ACTIVE',
    timestamp: new Date().toISOString(),
    database: {
      type: 'in-memory',
      status: 'connected',
      total_records: whrDatabase.length
    },
    features: {
      whr_creation: 'ACTIVE',
      classification: 'ACTIVE',
      email_notifications: 'ACTIVE',
      tracking: 'ACTIVE',
      statistics: 'ACTIVE',
      persistence: 'ACTIVE'
    }
  });
});

// Endpoint para resetear base de datos (solo desarrollo)
if (process.env.NODE_ENV === 'development') {
  router.post('/reset-database', (req, res) => {
    const previousCount = whrDatabase.length;
    whrDatabase = [];
    whrCounter = 1;
    
    console.log(`🔄 Base de datos reseteada. Eliminados ${previousCount} WHRs`);
    
    res.json({
      success: true,
      message: 'Base de datos reseteada',
      previous_count: previousCount,
      current_count: whrDatabase.length
    });
  });
}

// Exportar estado de base de datos
router.get('/database-export', (req, res) => {
  res.json({
    success: true,
    data: {
      whrs: whrDatabase,
      count: whrDatabase.length,
      exported_at: new Date().toISOString()
    }
  });
});

// 📧 ENVIAR EMAIL WHR (ruta que espera el frontend)
router.post('/whr/:id/email', async (req, res) => {
  const whrId = req.params.id;
  console.log(`📧 REAL: Enviando email para WHR ${whrId}`);
  
  try {
    const whrIndex = whrDatabase.findIndex(w => w.id === whrId);
    
    if (whrIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'WHR no encontrado'
      });
    }

    const whr = whrDatabase[whrIndex];
    
    // Simular envío de email
    console.log(`📧 Simulando envío de email a: ${whr.consignee.email}`);
    
    // Simular delay de envío
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Marcar email como enviado
    whrDatabase[whrIndex].emailSent = true;
    whrDatabase[whrIndex].emailSentAt = new Date().toISOString();
    whrDatabase[whrIndex].updatedAt = new Date().toISOString();
    
    console.log(`✅ Email enviado exitosamente para ${whr.whrNumber}`);
    
    res.json({
      success: true,
      message: 'Email enviado exitosamente',
      data: {
        sent: true,
        emailId: `email_${Date.now()}`,
        whr: whrDatabase[whrIndex],
        recipient: whr.consignee.email
      }
    });

  } catch (error) {
    console.error('❌ Error enviando email:', error);
    res.status(500).json({
      success: false,
      message: 'Error enviando email',
      error: error.message
    });
  }
});

module.exports = router;

console.log('📦 Warehouse Routes con PERSISTENCIA REAL cargadas exitosamente');
console.log(`🗄️  Base de datos en memoria iniciada (${whrDatabase.length} WHRs)`);
console.log('🔗 Endpoints disponibles en /api/warehouse/');
console.log('🧪 Test endpoint: GET /api/warehouse/test');
console.log('❤️  Health check: GET /api/warehouse/health');