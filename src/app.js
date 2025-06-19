// itobox-backend/src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// ============ MIDDLEWARE DE SEGURIDAD ============
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

app.use(compression());

// ============ CORS CONFIGURACIÓN ============
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ============ RATE LIMITING ============
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // Aumentado para desarrollo
  message: {
    success: false,
    message: 'Demasiadas peticiones, intente de nuevo en 15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// ============ PARSERS ============
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============ LOGGING MIDDLEWARE ============
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📡 ${timestamp} - ${req.method} ${req.path}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📝 Body:`, Object.keys(req.body));
  }
  
  next();
});

// ============ RUTAS BÁSICAS ============

// Ruta home
app.get('/', (req, res) => {
  console.log('🏠 Home endpoint accessed');
  res.json({
    message: '🚀 ITOBOX Courier Backend API',
    version: '1.2.0',
    status: 'Running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/health',
      warehouse: '/api/warehouse',
      auth: '/api/auth',
      packages: '/api/packages',
      tracking: '/api/tracking',
      dashboard: '/api/dashboard'
    },
    frontend: process.env.FRONTEND_URL || 'http://localhost:3000'
  });
});

// Health check global
app.get('/health', (req, res) => {
  console.log('❤️  Global health check');
  res.json({
    status: 'OK',
    service: 'ITOBOX Courier Backend',
    version: '1.2.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============ WAREHOUSE MODULE - MOCK ENDPOINTS ============

// Mock data storage (en memoria para desarrollo)
let mockWHRs = [
  {
    id: 1,
    whr_number: 'WHR241216001',
    shipper_name: 'ABC Company',
    shipper_email: 'shipper@abc.com',
    consignee_name: 'XYZ Corp',
    consignee_email: 'consignee@xyz.com',
    tracking_number: 'TRK241216001',
    pieces: 2,
    weight: 15.5,
    volume: 0.045,
    volume_weight: 0.468,
    declared_value: 1500.00,
    classification: 'pending',
    email_sent: false,
    arrival_date: new Date().toISOString(),
    created_at: new Date().toISOString()
  }
];

// Warehouse health check
app.get('/api/warehouse/health', (req, res) => {
  console.log('🏥 Warehouse health check requested');
  res.json({
    status: 'OK',
    service: 'Warehouse Module',
    timestamp: new Date().toISOString(),
    database: 'Mock (Development)',
    whr_count: mockWHRs.length,
    version: '1.0.0'
  });
});

// Get all WHRs - FIXED VERSION
app.get('/api/warehouse/whr', (req, res) => {
  console.log('📦 GET WHRs requested');
  console.log('🔍 DEBUG: mockWHRs array:', JSON.stringify(mockWHRs, null, 2));
  
  const { search, classification, limit = 50, offset = 0 } = req.query;
  
  let filteredWHRs = mockWHRs;
  
  // Apply search filter
  if (search) {
    filteredWHRs = filteredWHRs.filter(whr => 
      whr.whr_number?.toLowerCase().includes(search.toLowerCase()) ||
      whr.tracking_number?.toLowerCase().includes(search.toLowerCase()) ||
      whr.consignee_name?.toLowerCase().includes(search.toLowerCase()) ||
      whr.shipper_name?.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  // Apply classification filter
  if (classification && classification !== 'all') {
    filteredWHRs = filteredWHRs.filter(whr => whr.classification === classification);
  }
  
  // Apply pagination
  const startIndex = parseInt(offset);
  const endIndex = startIndex + parseInt(limit);
  const paginatedWHRs = filteredWHRs.slice(startIndex, endIndex);
  
  console.log('🔍 DEBUG: paginatedWHRs:', JSON.stringify(paginatedWHRs, null, 2));
  
  // ✅ FIX: MAPEAR DATOS AL FORMATO FRONTEND
  const mappedWHRs = paginatedWHRs.map((whr, index) => {
    console.log(`🔍 DEBUG: Mapping WHR ${index}:`, {
      original_whr_number: whr.whr_number,
      original_tracking: whr.tracking_number,
      original_consignee: whr.consignee_name,
      original_shipper: whr.shipper_name
    });
    
    return {
      id: String(whr.id),
      whrNumber: whr.whr_number || 'NO-WHR-NUMBER',
      trackingNumber: whr.tracking_number || 'NO-TRACKING',
      arrivalDate: whr.arrival_date || new Date().toISOString(),
      classification: whr.classification || 'pending',
      emailSent: Boolean(whr.email_sent),
      status: whr.classification || 'pending',
      carrier: whr.carrier || 'N/A',
      receivedBy: whr.received_by || 'Admin Usuario',
      consignee: {
        name: whr.consignee_name || 'NO-CONSIGNEE-NAME',
        company: whr.consignee_company || '',
        address: whr.consignee_address || '',
        phone: whr.consignee_phone || '',
        email: whr.consignee_email || ''
      },
      shipper: {
        name: whr.shipper_name || 'NO-SHIPPER-NAME',
        company: whr.shipper_company || '',
        address: whr.shipper_address || '',
        phone: whr.shipper_phone || ''
      },
      content: whr.content || 'N/A',
      pieces: Number(whr.pieces) || 0,
      weight: Number(whr.weight) || 0,
      length: Number(whr.length) || 0,
      width: Number(whr.width) || 0,
      height: Number(whr.height) || 0,
      volume: Number(whr.volume) || 0,
      volumeWeight: Number(whr.volume_weight) || 0,
      declaredValue: Number(whr.declared_value) || 0,
      invoiceNumber: whr.invoice_number || '',
      poNumber: whr.po_number || '',
      departureDate: whr.departure_date || '',
      transport: whr.transport || 'air',
      estimatedArrivalCR: whr.estimated_arrival_cr || '',
      notes: whr.notes || ''
    };
  });
  
  console.log('🔍 DEBUG: Final mappedWHRs:', JSON.stringify(mappedWHRs, null, 2));
  console.log(`📊 Returning ${mappedWHRs.length} WHRs (total: ${filteredWHRs.length})`);
  
  res.json({
    success: true,
    data: mappedWHRs,
    pagination: {
      total: filteredWHRs.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      has_next: endIndex < filteredWHRs.length
    }
  });
});

// Create new WHR
app.post('/api/warehouse/whr', (req, res) => {
  console.log('✨ Creating new WHR');
  console.log('📝 Data received:', Object.keys(req.body));
  
  try {
    const {
      shipper_name,
      shipper_email,
      consignee_name,
      consignee_email,
      tracking_number,
      pieces,
      weight,
      length,
      width,
      height,
      declared_value
    } = req.body;
    
    // Generate WHR number
    const today = new Date();
    const dateStr = today.toISOString().slice(2, 10).replace(/-/g, '');
    const sequence = String(mockWHRs.length + 1).padStart(3, '0');
    const whr_number = `WHR${dateStr}${sequence}`;
    
    // Calculate volume and volume weight
    const volume = (length * width * height) * 0.000578746;
    const volume_weight = volume * 10.4;
    
    // Create new WHR
    const newWHR = {
      id: mockWHRs.length + 1,
      whr_number,
      shipper_name,
      shipper_email,
      consignee_name,
      consignee_email,
      tracking_number,
      pieces: parseInt(pieces),
      weight: parseFloat(weight),
      length: parseFloat(length),
      width: parseFloat(width),
      height: parseFloat(height),
      volume: parseFloat(volume.toFixed(6)),
      volume_weight: parseFloat(volume_weight.toFixed(3)),
      declared_value: parseFloat(declared_value),
      classification: 'pending',
      email_sent: false,
      arrival_date: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    
    mockWHRs.push(newWHR);
    
    console.log(`✅ WHR created: ${whr_number}`);
    
    res.status(201).json({
      success: true,
      message: 'WHR creado exitosamente',
      data: newWHR
    });
    
  } catch (error) {
    console.error('❌ Error creating WHR:', error);
    res.status(400).json({
      success: false,
      message: 'Error creando WHR',
      error: error.message
    });
  }
});

// Classify WHR (AWB/BL)
app.put('/api/warehouse/whr/:id/classify', (req, res) => {
  console.log(`🏷️  Classifying WHR ID: ${req.params.id}`);
  
  try {
    const { id } = req.params;
    const { classification } = req.body;
    
    const whrIndex = mockWHRs.findIndex(whr => whr.id === parseInt(id));
    
    if (whrIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'WHR no encontrado'
      });
    }
    
    mockWHRs[whrIndex].classification = classification;
    mockWHRs[whrIndex].classification_date = new Date().toISOString();
    
    console.log(`✅ WHR ${mockWHRs[whrIndex].whr_number} classified as: ${classification}`);
    
    res.json({
      success: true,
      message: `WHR clasificado como ${classification}`,
      data: mockWHRs[whrIndex]
    });
    
  } catch (error) {
    console.error('❌ Error classifying WHR:', error);
    res.status(400).json({
      success: false,
      message: 'Error clasificando WHR',
      error: error.message
    });
  }
});

// Send email notification
app.post('/api/warehouse/whr/:id/email', (req, res) => {
  console.log(`📧 Sending email for WHR ID: ${req.params.id}`);
  
  try {
    const { id } = req.params;
    
    const whrIndex = mockWHRs.findIndex(whr => whr.id === parseInt(id));
    
    if (whrIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'WHR no encontrado'
      });
    }
    
    // Simulate email sending
    mockWHRs[whrIndex].email_sent = true;
    mockWHRs[whrIndex].email_sent_date = new Date().toISOString();
    
    console.log(`✅ Email sent for WHR: ${mockWHRs[whrIndex].whr_number}`);
    
    res.json({
      success: true,
      message: 'Email enviado exitosamente',
      data: mockWHRs[whrIndex]
    });
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
    res.status(400).json({
      success: false,
      message: 'Error enviando email',
      error: error.message
    });
  }
});

// Delete WHR
app.delete('/api/warehouse/whr/:id', (req, res) => {
  console.log(`🗑️  Deleting WHR ID: ${req.params.id}`);
  
  try {
    const { id } = req.params;
    
    const whrIndex = mockWHRs.findIndex(whr => whr.id === parseInt(id));
    
    if (whrIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'WHR no encontrado'
      });
    }
    
    const deletedWHR = mockWHRs.splice(whrIndex, 1)[0];
    
    console.log(`✅ WHR deleted: ${deletedWHR.whr_number}`);
    
    res.json({
      success: true,
      message: 'WHR eliminado exitosamente',
      data: deletedWHR
    });
    
  } catch (error) {
    console.error('❌ Error deleting WHR:', error);
    res.status(400).json({
      success: false,
      message: 'Error eliminando WHR',
      error: error.message
    });
  }
});

// Get warehouse statistics
app.get('/api/warehouse/stats', (req, res) => {
  console.log('📊 Warehouse stats requested');
  
  const stats = {
    total_whrs: mockWHRs.length,
    pending_classification: mockWHRs.filter(w => w.classification === 'pending').length,
    awb_classified: mockWHRs.filter(w => w.classification === 'awb').length,
    bl_classified: mockWHRs.filter(w => w.classification === 'bl').length,
    emails_sent: mockWHRs.filter(w => w.email_sent).length,
    total_pieces: mockWHRs.reduce((sum, w) => sum + w.pieces, 0),
    total_weight: mockWHRs.reduce((sum, w) => sum + w.weight, 0),
    total_value: mockWHRs.reduce((sum, w) => sum + w.declared_value, 0)
  };
  
  console.log('📈 Stats calculated:', stats);
  
  res.json({
    success: true,
    data: stats
  });
});

// Test endpoint
app.get('/api/warehouse/test', (req, res) => {
  console.log('🧪 Warehouse test endpoint called');
  res.json({
    message: '✅ Warehouse backend is working!',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/warehouse/health - Health check',
      'GET /api/warehouse/whr - List WHRs',
      'POST /api/warehouse/whr - Create WHR',
      'PUT /api/warehouse/whr/:id/classify - Classify WHR',
      'POST /api/warehouse/whr/:id/email - Send email',
      'DELETE /api/warehouse/whr/:id - Delete WHR',
      'GET /api/warehouse/stats - Get statistics'
    ],
    mock_data: {
      whrs: mockWHRs.length,
      sample: mockWHRs[0] || null
    }
  });
});

// ============ WEBSOCKETS ============
io.on('connection', (socket) => {
  console.log('🔌 Socket client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔌 Socket client disconnected:', socket.id);
  });
  
  socket.on('join_warehouse', () => {
    socket.join('warehouse');
    console.log(`📦 Socket ${socket.id} joined warehouse room`);
  });
});

// ============ ERROR HANDLING ============

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404 - Path not found: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method,
    available_endpoints: [
      'GET /',
      'GET /health',
      'GET /api/warehouse/health',
      'GET /api/warehouse/test',
      'GET /api/warehouse/whr',
      'POST /api/warehouse/whr'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('💥 Global error handler:', error);
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'JSON inválido'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { 
      error: error.message,
      stack: error.stack 
    })
  });
});

module.exports = { app, server, io };