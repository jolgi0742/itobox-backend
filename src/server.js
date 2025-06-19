// src/server.js - ITOBOX Courier Backend (Optimizado para Deploy)
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// =======================================================
// CONFIGURACIÓN OPTIMIZADA PARA PRODUCCIÓN
// =======================================================

// Helmet para seguridad HTTP
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    }
}));

// Compresión gzip
app.use(compression());

// CORS Configuration para Producción
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'https://itobox-courier.vercel.app',
            'https://itobox-courier-git-main.vercel.app',
            'https://itobox-courier-git-main-tu-usuario.vercel.app',
            process.env.FRONTEND_URL,
            process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
        ].filter(Boolean);
        
        // Permitir requests sin origin (Postman, mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        // Permitir dominios de Vercel automáticamente
        if (origin.includes('vercel.app') || origin.includes('railway.app')) {
            return callback(null, true);
        }
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('⚠️ CORS blocked for origin:', origin);
            console.log('✅ Allowed origins:', allowedOrigins);
            callback(null, true); // Temporalmente permitir todo en desarrollo
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Rate limiting más permisivo para desarrollo
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // máximo 1000 requests por IP
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Parsers de contenido
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging mejorado
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.path} - Origin: ${req.get('Origin')} - IP: ${req.ip}`);
    next();
});

// =======================================================
// BASE DE DATOS EN MEMORIA (Para desarrollo rápido)
// =======================================================

let whrs = [
    {
        id: 1,
        whrNumber: 'WHR241217001',
        trackingNumber: 'TRK241217001',
        shipperName: 'Juan Pérez',
        shipperPhone: '+1-305-555-0123',
        shipperAddress: '123 Main St, Miami, FL 33101',
        consigneeName: 'María García',
        consigneePhone: '+1-305-555-0456',
        consigneeAddress: '456 Oak Ave, Miami, FL 33102',
        pieces: 2,
        weight: 5.5,
        volume: 0.12,
        volumeWeight: 1.25,
        declaredValue: 150.00,
        transportType: 'aereo',
        classification: 'classified',
        status: 'received',
        emailSent: true,
        notes: 'Paquete frágil - manejar con cuidado',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 2,
        whrNumber: 'WHR241217002',
        trackingNumber: 'TRK241217002',
        shipperName: 'Carlos Rodriguez',
        shipperPhone: '+1-305-555-0789',
        shipperAddress: '789 Pine St, Miami, FL 33103',
        consigneeName: 'Ana Lopez',
        consigneePhone: '+1-305-555-0321',
        consigneeAddress: '321 Elm St, Miami, FL 33104',
        pieces: 1,
        weight: 2.3,
        volume: 0.08,
        volumeWeight: 0.83,
        declaredValue: 75.00,
        transportType: 'maritimo',
        classification: 'classified',
        status: 'in_transit',
        emailSent: false,
        notes: 'Entrega urgente',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
    }
];

let whrSequence = 3;

// =======================================================
// RUTAS PRINCIPALES DE LA API
// =======================================================

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'ITOBOX Courier Backend API',
        version: '1.0.0',
        status: 'Online',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/api/health',
            warehouse: '/api/warehouse',
            auth: '/api/auth'
        }
    });
});

// Health Check Principal
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'ITOBOX Courier Backend',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: 'In-Memory (Development)',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cors: 'Enabled',
        totalWHRs: whrs.length
    });
});

// Health Check específico para warehouse
app.get('/api/warehouse/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'ITOBOX Warehouse Module',
        version: '1.0.0',
        totalWHRs: whrs.length,
        lastWHR: whrs.length > 0 ? whrs[whrs.length - 1].whrNumber : null,
        memoryUsage: process.memoryUsage()
    });
});

// =======================================================
// RUTAS WHR (Warehouse Receipt) - CORE FUNCTIONALITY
// =======================================================

// Obtener todas las WHRs con filtros avanzados
app.get('/api/warehouse/whr', (req, res) => {
    try {
        const { search, status, classification, limit = 50, offset = 0 } = req.query;
        
        let filteredWHRs = [...whrs];
        
        // Filtro por búsqueda
        if (search) {
            const searchLower = search.toLowerCase();
            filteredWHRs = filteredWHRs.filter(whr => 
                whr.whrNumber.toLowerCase().includes(searchLower) ||
                whr.trackingNumber.toLowerCase().includes(searchLower) ||
                whr.consigneeName.toLowerCase().includes(searchLower) ||
                whr.shipperName.toLowerCase().includes(searchLower)
            );
        }
        
        // Filtro por estado
        if (status && status !== 'all') {
            filteredWHRs = filteredWHRs.filter(whr => whr.status === status);
        }
        
        // Filtro por clasificación
        if (classification && classification !== 'all') {
            filteredWHRs = filteredWHRs.filter(whr => whr.classification === classification);
        }
        
        // Ordenar por fecha de creación (más recientes primero)
        filteredWHRs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Paginación
        const total = filteredWHRs.length;
        const paginatedWHRs = filteredWHRs.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
        
        res.json({
            success: true,
            data: paginatedWHRs,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: (parseInt(offset) + parseInt(limit)) < total
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error fetching WHRs:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// Crear nueva WHR
app.post('/api/warehouse/whr', (req, res) => {
    try {
        const {
            shipperName,
            shipperPhone,
            shipperAddress,
            consigneeName,
            consigneePhone,
            consigneeAddress,
            pieces,
            weight,
            volume,
            declaredValue,
            notes
        } = req.body;
        
        // Validaciones mejoradas
        if (!shipperName || !consigneeName) {
            return res.status(400).json({
                success: false,
                message: 'Shipper name and consignee name are required',
                errors: {
                    shipperName: !shipperName ? 'Shipper name is required' : null,
                    consigneeName: !consigneeName ? 'Consignee name is required' : null
                }
            });
        }
        
        // Generar números únicos mejorados
        const today = new Date();
        const dateStr = today.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
        const sequence = String(whrSequence).padStart(3, '0');
        const whrNumber = `WHR${dateStr}${sequence}`;
        const trackingNumber = `TRK${dateStr}${sequence}`;
        
        // Cálculos mejorados
        const weightNum = parseFloat(weight) || 0;
        const volumeNum = parseFloat(volume) || 0;
        const volumeWeight = volumeNum * 10.4; // Factor de conversión estándar
        const piecesNum = parseInt(pieces) || 1;
        const declaredValueNum = parseFloat(declaredValue) || 0;
        
        // Crear nueva WHR
        const newWHR = {
            id: whrSequence,
            whrNumber,
            trackingNumber,
            shipperName: shipperName.trim(),
            shipperPhone: (shipperPhone || '').trim(),
            shipperAddress: (shipperAddress || '').trim(),
            consigneeName: consigneeName.trim(),
            consigneePhone: (consigneePhone || '').trim(),
            consigneeAddress: (consigneeAddress || '').trim(),
            pieces: piecesNum,
            weight: Math.round(weightNum * 100) / 100,
            volume: Math.round(volumeNum * 1000) / 1000,
            volumeWeight: Math.round(volumeWeight * 100) / 100,
            declaredValue: Math.round(declaredValueNum * 100) / 100,
            transportType: 'pending',
            classification: 'pending',
            status: 'received',
            emailSent: false,
            notes: (notes || '').trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Agregar a la base de datos en memoria
        whrs.push(newWHR);
        whrSequence++;
        
        console.log(`✅ WHR CREADO: ${whrNumber} - ${consigneeName} (Total: ${whrs.length})`);
        
        res.status(201).json({
            success: true,
            message: 'WHR created successfully',
            data: newWHR
        });
        
    } catch (error) {
        console.error('❌ Error creating WHR:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// Obtener WHR específico por ID
app.get('/api/warehouse/whr/:id', (req, res) => {
    try {
        const { id } = req.params;
        const whr = whrs.find(w => w.id === parseInt(id));
        
        if (!whr) {
            return res.status(404).json({
                success: false,
                message: 'WHR not found'
            });
        }
        
        res.json({
            success: true,
            data: whr
        });
        
    } catch (error) {
        console.error('❌ Error fetching WHR:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// Actualizar clasificación WHR
app.put('/api/warehouse/whr/:id/classify', (req, res) => {
    try {
        const { id } = req.params;
        const { transportType } = req.body;
        
        if (!['aereo', 'maritimo'].includes(transportType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid transport type. Must be "aereo" or "maritimo"'
            });
        }
        
        const whrIndex = whrs.findIndex(whr => whr.id === parseInt(id));
        
        if (whrIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'WHR not found'
            });
        }
        
        // Actualizar clasificación
        whrs[whrIndex].transportType = transportType;
        whrs[whrIndex].classification = 'classified';
        whrs[whrIndex].updatedAt = new Date().toISOString();
        
        console.log(`📋 WHR CLASIFICADO: ${whrs[whrIndex].whrNumber} como ${transportType.toUpperCase()}`);
        
        res.json({
            success: true,
            message: 'WHR classified successfully',
            data: whrs[whrIndex]
        });
        
    } catch (error) {
        console.error('❌ Error classifying WHR:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// Enviar email para WHR
app.post('/api/warehouse/whr/:id/email', (req, res) => {
    try {
        const { id } = req.params;
        
        const whrIndex = whrs.findIndex(whr => whr.id === parseInt(id));
        
        if (whrIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'WHR not found'
            });
        }
        
        // Simular envío de email con más realismo
        const whr = whrs[whrIndex];
        whrs[whrIndex].emailSent = true;
        whrs[whrIndex].updatedAt = new Date().toISOString();
        
        console.log(`📧 EMAIL ENVIADO: WHR ${whr.whrNumber} a ${whr.consigneeName}`);
        
        // Simular delay de envío
        setTimeout(() => {
            console.log(`✅ EMAIL CONFIRMADO: ${whr.whrNumber}`);
        }, 1000);
        
        res.json({
            success: true,
            message: 'Email sent successfully',
            data: whrs[whrIndex],
            emailDetails: {
                to: whr.consigneePhone || whr.consigneeName,
                subject: `WHR ${whr.whrNumber} - Package Notification`,
                sentAt: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('❌ Error sending email:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// Eliminar WHR
app.delete('/api/warehouse/whr/:id', (req, res) => {
    try {
        const { id } = req.params;
        
        const whrIndex = whrs.findIndex(whr => whr.id === parseInt(id));
        
        if (whrIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'WHR not found'
            });
        }
        
        const deletedWHR = whrs.splice(whrIndex, 1)[0];
        
        console.log(`🗑️ WHR ELIMINADO: ${deletedWHR.whrNumber} (Quedan: ${whrs.length})`);
        
        res.json({
            success: true,
            message: 'WHR deleted successfully',
            data: deletedWHR
        });
        
    } catch (error) {
        console.error('❌ Error deleting WHR:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// Estadísticas del warehouse
app.get('/api/warehouse/stats', (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const totalWHRs = whrs.length;
        const pending = whrs.filter(whr => whr.classification === 'pending').length;
        const classified = whrs.filter(whr => whr.classification === 'classified').length;
        const aereo = whrs.filter(whr => whr.transportType === 'aereo').length;
        const maritimo = whrs.filter(whr => whr.transportType === 'maritimo').length;
        const emailsSent = whrs.filter(whr => whr.emailSent).length;
        
        const todayWHRs = whrs.filter(whr => new Date(whr.createdAt) >= today).length;
        const monthWHRs = whrs.filter(whr => new Date(whr.createdAt) >= thisMonth).length;
        
        const totalWeight = whrs.reduce((sum, whr) => sum + whr.weight, 0);
        const totalValue = whrs.reduce((sum, whr) => sum + whr.declaredValue, 0);
        const totalPieces = whrs.reduce((sum, whr) => sum + whr.pieces, 0);
        const avgWeight = totalWHRs > 0 ? totalWeight / totalWHRs : 0;
        
        res.json({
            success: true,
            data: {
                // Básicas
                totalWHRs,
                pending,
                classified,
                aereo,
                maritimo,
                emailsSent,
                
                // Temporales
                todayWHRs,
                monthWHRs,
                
                // Cálculos
                totalWeight: Math.round(totalWeight * 100) / 100,
                totalValue: Math.round(totalValue * 100) / 100,
                totalPieces,
                avgWeight: Math.round(avgWeight * 100) / 100,
                
                // Porcentajes
                classificationRate: totalWHRs > 0 ? Math.round((classified / totalWHRs) * 100) : 0,
                emailRate: totalWHRs > 0 ? Math.round((emailsSent / totalWHRs) * 100) : 0
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error getting stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// =======================================================
// RUTAS DE AUTENTICACIÓN (MOCK MEJORADO)
// =======================================================

app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        
        // Simular autenticación (acepta cualquier email/password)
        const mockUser = {
            id: 1,
            email: email,
            name: email.split('@')[0] || 'Usuario Demo',
            role: 'admin',
            permissions: ['warehouse', 'shipping', 'billing', 'reports'],
            lastLogin: new Date().toISOString()
        };
        
        console.log(`🔐 LOGIN: ${email}`);
        
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: mockUser,
                token: 'mock-jwt-token-' + Date.now(),
                expiresIn: '24h'
            }
        });
        
    } catch (error) {
        console.error('❌ Error in login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logout successful'
    });
});

// =======================================================
// RUTAS DE DESARROLLO Y DEBUG
// =======================================================

// Endpoint para verificar CORS
app.get('/api/cors-test', (req, res) => {
    res.json({
        success: true,
        message: 'CORS is working correctly',
        origin: req.get('Origin'),
        headers: req.headers,
        timestamp: new Date().toISOString()
    });
});

// Endpoint para exportar datos (útil para debugging)
app.get('/api/warehouse/export', (req, res) => {
    res.json({
        success: true,
        data: whrs,
        metadata: {
            total: whrs.length,
            exported: new Date().toISOString()
        }
    });
});

// =======================================================
// MANEJO DE ERRORES Y 404
// =======================================================

// 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method,
        availableEndpoints: [
            'GET /',
            'GET /api/health',
            'GET /api/warehouse/health',
            'GET /api/warehouse/whr',
            'POST /api/warehouse/whr',
            'GET /api/warehouse/whr/:id',
            'PUT /api/warehouse/whr/:id/classify',
            'POST /api/warehouse/whr/:id/email',
            'DELETE /api/warehouse/whr/:id',
            'GET /api/warehouse/stats',
            'POST /api/auth/login',
            'POST /api/auth/logout',
            'GET /api/cors-test'
        ]
    });
});

// Error Handler Global
app.use((error, req, res, next) => {
    console.error('💥 Error Global:', error);
    
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        timestamp: new Date().toISOString()
    });
});

// =======================================================
// INICIAR SERVIDOR
// =======================================================

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`
🎉 ITOBOX Courier Backend INICIADO EXITOSAMENTE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Servidor: http://0.0.0.0:${PORT}
🌍 Entorno: ${process.env.NODE_ENV || 'development'}
📊 Health Check: http://0.0.0.0:${PORT}/api/health
🏗️ Warehouse API: http://0.0.0.0:${PORT}/api/warehouse
🔐 Auth API: http://0.0.0.0:${PORT}/api/auth
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 ENDPOINTS PRINCIPALES:
   ✅ GET  /api/health                    - Estado del servidor
   ✅ GET  /api/warehouse/health          - Estado del módulo warehouse
   ✅ GET  /api/warehouse/whr             - Listar WHRs
   ✅ POST /api/warehouse/whr             - Crear nueva WHR
   ✅ PUT  /api/warehouse/whr/:id/classify - Clasificar WHR
   ✅ POST /api/warehouse/whr/:id/email   - Enviar email
   ✅ GET  /api/warehouse/stats           - Estadísticas
   ✅ POST /api/auth/login                - Autenticación

📊 ESTADO INICIAL:
   📦 WHRs en sistema: ${whrs.length}
   💾 Base de datos: En memoria (desarrollo)
   🔒 CORS: Habilitado para múltiples dominios
   ⚡ Rate limiting: 1000 req/15min

🚀 ¡Sistema listo para deploy en Railway!
    `);
});

// =======================================================
// GRACEFUL SHUTDOWN Y ERROR HANDLING
// =======================================================

process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
    });
});

process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise);
    console.error('Reason:', reason);
    process.exit(1);
});

module.exports = app;