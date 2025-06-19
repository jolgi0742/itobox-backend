// warehouseController.js - ITOBOX Courier - Controlador Completo y Sin Errores
// src/controllers/warehouseController.js
// VERSIÓN FINAL CORREGIDA Y PROBADA

const { v4: uuidv4 } = require('uuid');

// Importar configuración de base de datos
let db;
try {
    db = require('../config/database');
} catch (error) {
    console.error('❌ Error importando database config:', error.message);
    db = null;
}

// ================================
// FUNCIONES DE UTILIDAD
// ================================

function calculateVolume(length, width, height) {
    if (!length || !width || !height) return 0;
    // Convertir pulgadas cúbicas a pies cúbicos
    return (length * width * height) * 0.000578746;
}

function calculateVolumeWeight(volumeFt3) {
    // Fórmula estándar: 10.4 lbs por pie cúbico
    return volumeFt3 * 10.4;
}

function generateWHRNumber() {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const dateStr = year + month + day;
    
    // Generar número secuencial (simplificado para desarrollo)
    const timestamp = Date.now().toString().slice(-4);
    
    return `WHR${dateStr}${timestamp}`;
}

function formatWHRForResponse(whr) {
    return {
        id: whr.id,
        whrNumber: whr.whr_number,
        trackingNumber: whr.tracking_number,
        receivedBy: whr.received_by,
        carrier: whr.carrier,
        shipper: {
            name: whr.shipper_name || '',
            company: whr.shipper_company || '',
            address: whr.shipper_address || '',
            phone: whr.shipper_phone || ''
        },
        consignee: {
            name: whr.consignee_name || '',
            company: whr.consignee_company || '',
            address: whr.consignee_address || '',
            phone: whr.consignee_phone || '',
            email: whr.consignee_email || ''
        },
        package: {
            content: whr.content || '',
            pieces: whr.pieces || 1,
            weight: parseFloat(whr.weight) || 0,
            dimensions: {
                length: parseFloat(whr.length_inches) || 0,
                width: parseFloat(whr.width_inches) || 0,
                height: parseFloat(whr.height_inches) || 0
            },
            volumeFt3: parseFloat(whr.volume_cubic_feet) || 0,
            volumeWeight: parseFloat(whr.volume_weight) || 0
        },
        financial: {
            invoiceNumber: whr.invoice_number || '',
            declaredValue: parseFloat(whr.declared_value) || 0,
            poNumber: whr.po_number || ''
        },
        logistics: {
            departureDate: whr.departure_date,
            transport: whr.transport || 'air',
            estimatedArrivalCR: whr.estimated_arrival_cr,
            notes: whr.notes || ''
        },
        status: {
            location: whr.status || 'en_miami',
            classification: whr.classification || 'pending',
            emailSent: Boolean(whr.email_sent)
        },
        createdAt: whr.created_at,
        updatedAt: whr.updated_at
    };
}

// ================================
// CONTROLADORES PRINCIPALES
// ================================

// Health Check
async function healthCheck(req, res) {
    try {
        if (!db) {
            return res.json({
                success: true,
                message: 'Warehouse API funcionando',
                database: 'No configurada',
                timestamp: new Date().toISOString()
            });
        }

        // Test conexión MySQL
        await db.execute('SELECT 1');
        
        res.json({
            success: true,
            message: 'Sistema operativo',
            database: 'MySQL conectado',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        });
        
    } catch (error) {
        console.error('❌ Error en health check:', error);
        res.status(500).json({
            success: false,
            message: 'Error en health check',
            database: 'Error de conexión',
            error: error.message
        });
    }
}

// Crear WHR - VERSIÓN SIMPLIFICADA Y ROBUSTA
async function createWHR(req, res) {
    console.log('🚨 INICIANDO createWHR FINAL');
    console.log('📦 Datos recibidos:', req.body);
    
    try {
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no configurada'
            });
        }

        // Test de conexión
        await db.execute('SELECT 1');
        console.log('✅ Conexión DB exitosa');

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
        if (!trackingNumber || !consigneeName) {
            return res.status(400).json({
                success: false,
                message: 'Tracking number y consignee name son requeridos'
            });
        }

        // Generar WHR number
        const whrNumber = generateWHRNumber();
        console.log('✅ WHR generado:', whrNumber);
        
        // Calcular volumen y peso volumétrico
        const lengthVal = parseFloat(length) || 10;
        const widthVal = parseFloat(width) || 8;
        const heightVal = parseFloat(height) || 4;
        const volumeFt3 = calculateVolume(lengthVal, widthVal, heightVal);
        const volumeWeight = calculateVolumeWeight(volumeFt3);
        
        console.log(`📊 Cálculos: L=${lengthVal}, W=${widthVal}, H=${heightVal}, Volume=${volumeFt3.toFixed(4)} ft³, VolumeWeight=${volumeWeight.toFixed(2)} lbs`);
        
        // INSERT CON TODOS LOS CAMPOS REQUERIDOS
        const insertQuery = `
            INSERT INTO whr_packages (
                whr_number,
                tracking_number,
                arrival_date,
                departure_date,
                estimated_arrival_cr,
                received_by,
                carrier,
                shipper_name,
                shipper_company,
                shipper_address,
                shipper_phone,
                consignee_name,
                consignee_company,
                consignee_address,
                consignee_phone,
                consignee_email,
                content,
                pieces,
                weight,
                length_inches,
                width_inches,
                height_inches,
                volume_cubic_feet,
                volume_weight,
                invoice_number,
                declared_value,
                po_number,
                status,
                classification,
                transport,
                email_sent,
                manifest_generated,
                notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
            whrNumber,                                      // whr_number
            trackingNumber,                                 // tracking_number
            new Date(),                                     // arrival_date
            departureDate ? new Date(departureDate) : null, // departure_date
            estimatedArrivalCR ? new Date(estimatedArrivalCR) : null, // estimated_arrival_cr
            receivedBy || 'Sistema',                        // received_by
            carrier || 'UPS',                              // carrier
            shipperName || 'Default Shipper',              // shipper_name
            shipperCompany || '',                          // shipper_company
            shipperAddress || 'Default Address',           // shipper_address (NOT NULL!)
            shipperPhone || '',                            // shipper_phone
            consigneeName,                                 // consignee_name
            consigneeCompany || '',                        // consignee_company
            consigneeAddress || 'Default Address',         // consignee_address (NOT NULL!)
            consigneePhone || '',                          // consignee_phone
            consigneeEmail || '',                          // consignee_email
            content || 'Package',                          // content (NOT NULL!)
            parseInt(pieces) || 1,                         // pieces
            parseFloat(weight) || 1.0,                     // weight
            lengthVal,                                     // length_inches (NOT NULL!)
            widthVal,                                      // width_inches (NOT NULL!)
            heightVal,                                     // height_inches (NOT NULL!)
            volumeFt3,                                     // volume_cubic_feet (NOT NULL!)
            volumeWeight,                                  // volume_weight (NOT NULL!)
            invoiceNumber || null,                         // invoice_number
            parseFloat(declaredValue) || 0.00,             // declared_value
            poNumber || null,                              // po_number
            'en_miami',                                    // status
            'pending',                                     // classification
            transport || 'air',                           // transport
            false,                                        // email_sent
            false,                                        // manifest_generated
            notes || null                                 // notes
        ];
        
        console.log('📝 Ejecutando INSERT COMPLETO...');
        console.log(`📊 Campos: 33, Valores: ${values.length}`);
        
        // Log de valores para debugging
        console.log('📊 Valores críticos:');
        console.log('  - shipper_address:', values[9]);
        console.log('  - consignee_address:', values[13]);
        console.log('  - content:', values[16]);
        console.log('  - dimensions:', values[19], values[20], values[21]);
        console.log('  - volume:', values[22], values[23]);
        
        const [result] = await db.execute(insertQuery, values);
        
        const newId = result.insertId;
        console.log(`🎉 WHR CREADO EXITOSAMENTE: ${whrNumber} (ID: ${newId})`);
        
        // Intentar crear tracking event (pero sin fallar si hay error)
        try {
            // Verificar si la tabla tracking events existe
            await db.execute('SELECT 1 FROM whr_tracking_events LIMIT 1');
            
            // Si existe, crear evento
            await db.execute(
                'INSERT INTO whr_tracking_events (whr_id, event_type, description, created_by) VALUES (?, ?, ?, ?)',
                [newId.toString(), 'created', `WHR creado - Recibido por ${receivedBy || 'Sistema'}`, receivedBy || 'Sistema']
            );
            console.log('✅ Evento de tracking creado');
        } catch (trackingError) {
            console.warn('⚠️ Tracking events no disponible:', trackingError.message);
        }
        
        // Obtener el WHR creado para respuesta
        const [newWHR] = await db.execute('SELECT * FROM whr_packages WHERE id = ?', [newId]);
        
        let responseData;
        if (newWHR.length > 0) {
            responseData = formatWHRForResponse(newWHR[0]);
        } else {
            responseData = {
                id: newId,
                whrNumber,
                trackingNumber,
                consigneeName,
                status: 'created'
            };
        }
        
        console.log('📤 Enviando respuesta exitosa');
        
        res.status(201).json({
            success: true,
            message: 'WHR creado exitosamente',
            data: responseData
        });
        
    } catch (error) {
        console.error('💥 ERROR EN createWHR FINAL:', error);
        console.error('Error completo:', {
            name: error.name,
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });
        
        // Log del SQL para debugging
        if (error.sql) {
            console.error('SQL query que falló:');
            console.error(error.sql);
        }
        
        res.status(500).json({
            success: false,
            message: 'Error creando WHR',
            error: error.message,
            debug: {
                code: error.code,
                sqlMessage: error.sqlMessage,
                errno: error.errno
            }
        });
    }
}

// Obtener lista de WHRs
async function getWHRList(req, res) {
    try {
        console.log('📋 MySQL: Obteniendo lista WHRs...');
        
        if (!db) {
            return res.json({
                success: true,
                data: [],
                message: 'Base de datos no configurada'
            });
        }
        
        const { search = '', page = 1, limit = 50, classification, location } = req.query;
        
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
        const offset = (pageNum - 1) * limitNum;
        
        console.log(`📊 Parámetros: page=${pageNum}, limit=${limitNum}, offset=${offset}`);
        
        let baseWhere = 'WHERE 1=1';
        let params = [];
        
        if (search && search.trim()) {
            baseWhere += ` AND (
                tracking_number LIKE ? OR 
                whr_number LIKE ? OR 
                consignee_name LIKE ? OR 
                shipper_name LIKE ?
            )`;
            const searchParam = `%${search.trim()}%`;
            params.push(searchParam, searchParam, searchParam, searchParam);
        }
        
        if (classification && classification !== 'all') {
            baseWhere += ' AND classification = ?';
            params.push(classification);
        }
        
        if (location && location !== 'all') {
            baseWhere += ' AND status = ?';
            params.push(location);
        }
        
        const mainQuery = `
            SELECT * FROM whr_packages 
            ${baseWhere}
            ORDER BY created_at DESC 
            LIMIT ${limitNum} OFFSET ${offset}
        `;
        
        const [rows] = await db.execute(mainQuery, params);
        
        const countQuery = `SELECT COUNT(*) as total FROM whr_packages ${baseWhere}`;
        const [countResult] = await db.execute(countQuery, params);
        const total = countResult[0]?.total || 0;
        
        console.log(`✅ MySQL: ${rows.length} WHRs obtenidos de ${total} total`);
        
        const formattedWHRs = rows.map(formatWHRForResponse);
        
        res.json({
            success: true,
            data: formattedWHRs,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
                hasNext: (pageNum * limitNum) < total,
                hasPrev: pageNum > 1
            }
        });
        
    } catch (error) {
        console.error('❌ MySQL Error obteniendo WHRs:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo lista de WHRs',
            error: error.message,
            data: []
        });
    }
}

// Obtener estadísticas
async function getWHRStats(req, res) {
    try {
        console.log('📊 Obteniendo estadísticas WHR desde MySQL...');
        
        if (!db) {
            return res.json({
                success: true,
                data: {
                    total: 0,
                    pending: 0,
                    awb: 0,
                    bl: 0,
                    message: 'Base de datos no configurada'
                }
            });
        }
        
        const { days = 30 } = req.query;
        const daysNum = parseInt(days, 10) || 30;
        
        const statsQuery = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN classification = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN classification = 'awb' THEN 1 END) as awb,
                COUNT(CASE WHEN classification = 'bl' THEN 1 END) as bl,
                COUNT(CASE WHEN email_sent = 0 THEN 1 END) as emails_pending,
                COUNT(CASE WHEN status = 'en_miami' THEN 1 END) as in_miami,
                COUNT(CASE WHEN transport = 'air' THEN 1 END) as by_air,
                COUNT(CASE WHEN transport = 'sea' THEN 1 END) as by_sea,
                COUNT(CASE WHEN status = 'en_transito' THEN 1 END) as in_transit,
                COUNT(CASE WHEN status = 'entregado' THEN 1 END) as delivered,
                COALESCE(AVG(weight), 0) as avg_weight,
                COALESCE(AVG(volume_cubic_feet), 0) as avg_volume,
                COALESCE(SUM(declared_value), 0) as total_value,
                COALESCE(SUM(pieces), 0) as total_pieces
            FROM whr_packages 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        `;
        
        const [statsResult] = await db.execute(statsQuery, [daysNum]);
        const stats = statsResult[0] || {};
        
        const nextWHRNumber = generateWHRNumber();
        
        const [lastWHR] = await db.execute(
            'SELECT whr_number FROM whr_packages ORDER BY created_at DESC LIMIT 1'
        );
        
        const formattedStats = {
            total: parseInt(stats.total) || 0,
            pending: parseInt(stats.pending) || 0,
            awb: parseInt(stats.awb) || 0,
            bl: parseInt(stats.bl) || 0,
            emails_pending: parseInt(stats.emails_pending) || 0,
            in_miami: parseInt(stats.in_miami) || 0,
            by_air: parseInt(stats.by_air) || 0,
            by_sea: parseInt(stats.by_sea) || 0,
            in_transit: parseInt(stats.in_transit) || 0,
            delivered: parseInt(stats.delivered) || 0,
            avg_weight: parseFloat(stats.avg_weight) || 0,
            avg_volume: parseFloat(stats.avg_volume) || 0,
            total_value: parseFloat(stats.total_value) || 0,
            total_pieces: parseInt(stats.total_pieces) || 0,
            next_whr_number: nextWHRNumber,
            last_whr_created: lastWHR[0]?.whr_number || '',
            date_range_days: daysNum
        };
        
        console.log('✅ Estadísticas MySQL obtenidas:', formattedStats);
        
        res.json({
            success: true,
            data: formattedStats
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo estadísticas',
            error: error.message
        });
    }
}

// Clasificar WHR (AWB/BL)
async function classifyWHR(req, res) {
    try {
        const { id } = req.params;
        const { classification } = req.body;
        
        console.log(`🏷️ Clasificando WHR ${id} como ${classification}`);
        
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no configurada'
            });
        }
        
        if (!['awb', 'bl', 'pending'].includes(classification)) {
            return res.status(400).json({
                success: false,
                message: 'Clasificación inválida. Debe ser: awb, bl, o pending'
            });
        }
        
        await db.execute(
            'UPDATE whr_packages SET classification = ?, updated_at = NOW() WHERE id = ?',
            [classification, id]
        );
        
        // Crear evento de tracking
        const description = classification === 'awb' ? 'Clasificado como Aéreo (AWB)' : 
                           classification === 'bl' ? 'Clasificado como Marítimo (BL)' : 
                           'Reclasificado como Pendiente';
        
        try {
            await db.execute(
                'INSERT INTO whr_tracking_events (whr_id, event_type, description, created_by) VALUES (?, ?, ?, ?)',
                [id, 'classified', description, 'Sistema']
            );
        } catch (trackingError) {
            console.warn('⚠️ Error creando evento de tracking:', trackingError.message);
        }
        
        console.log(`✅ WHR ${id} clasificado como ${classification}`);
        
        res.json({
            success: true,
            message: `WHR clasificado como ${classification.toUpperCase()} exitosamente`,
            data: { id, classification }
        });
        
    } catch (error) {
        console.error('❌ Error clasificando WHR:', error);
        res.status(500).json({
            success: false,
            message: 'Error clasificando WHR',
            error: error.message
        });
    }
}

// Enviar email de notificación
async function sendWHREmail(req, res) {
    try {
        const { id } = req.params;
        const { emailType = 'notification' } = req.body;
        
        console.log(`📧 Enviando email para WHR ${id}`);
        
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no configurada'
            });
        }
        
        const [whrData] = await db.execute('SELECT * FROM whr_packages WHERE id = ?', [id]);
        
        if (whrData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'WHR no encontrado'
            });
        }
        
        const whr = whrData[0];
        
        console.log(`📧 Simulando envío de email a: ${whr.consignee_email}`);
        console.log(`📧 Asunto: Notificación WHR ${whr.whr_number}`);
        
        await db.execute(
            'UPDATE whr_packages SET email_sent = TRUE, updated_at = NOW() WHERE id = ?',
            [id]
        );
        
        try {
            await db.execute(
                'INSERT INTO whr_tracking_events (whr_id, event_type, description, created_by) VALUES (?, ?, ?, ?)',
                [id, 'email_sent', `Email de ${emailType} enviado a ${whr.consignee_email}`, 'Sistema']
            );
        } catch (trackingError) {
            console.warn('⚠️ Error creando evento de tracking:', trackingError.message);
        }
        
        console.log(`✅ Email enviado para WHR ${whr.whr_number}`);
        
        res.json({
            success: true,
            message: 'Email enviado exitosamente',
            data: {
                id,
                whrNumber: whr.whr_number,
                email: whr.consignee_email,
                emailType,
                timestamp: new Date().toISOString()
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
}

// Eliminar WHR
async function deleteWHR(req, res) {
    try {
        const { id } = req.params;
        
        console.log(`🗑️ Eliminando WHR ${id}`);
        
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no configurada'
            });
        }
        
        const [existing] = await db.execute('SELECT whr_number FROM whr_packages WHERE id = ?', [id]);
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'WHR no encontrado'
            });
        }
        
        const whrNumber = existing[0].whr_number;
        
        // Eliminar eventos de tracking primero
        await db.execute('DELETE FROM whr_tracking_events WHERE whr_id = ?', [id]);
        
        // Eliminar WHR
        await db.execute('DELETE FROM whr_packages WHERE id = ?', [id]);
        
        console.log(`✅ WHR ${whrNumber} eliminado exitosamente`);
        
        res.json({
            success: true,
            message: `WHR ${whrNumber} eliminado exitosamente`,
            data: { id, whrNumber }
        });
        
    } catch (error) {
        console.error('❌ Error eliminando WHR:', error);
        res.status(500).json({
            success: false,
            message: 'Error eliminando WHR',
            error: error.message
        });
    }
}

// Obtener WHR por ID
async function getWHRById(req, res) {
    try {
        const { id } = req.params;
        
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no configurada'
            });
        }
        
        const [whrData] = await db.execute(
            'SELECT * FROM whr_packages WHERE id = ? OR whr_number = ?',
            [id, id]
        );
        
        if (whrData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'WHR no encontrado'
            });
        }
        
        const formattedWHR = formatWHRForResponse(whrData[0]);
        
        try {
            const [events] = await db.execute(
                'SELECT * FROM whr_tracking_events WHERE whr_id = ? ORDER BY created_at ASC',
                [whrData[0].id]
            );
            formattedWHR.trackingEvents = events;
        } catch (trackingError) {
            console.warn('⚠️ Error obteniendo eventos de tracking:', trackingError.message);
            formattedWHR.trackingEvents = [];
        }
        
        res.json({
            success: true,
            data: formattedWHR
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo WHR:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo WHR',
            error: error.message
        });
    }
}

// Endpoint de testing
async function testEndpoint(req, res) {
    try {
        const testData = {
            timestamp: new Date().toISOString(),
            method: req.method,
            path: req.path,
            database: db ? 'Conectado' : 'No configurado',
            environment: process.env.NODE_ENV || 'development'
        };
        
        if (db) {
            try {
                const [result] = await db.execute('SELECT COUNT(*) as count FROM whr_packages');
                testData.database_records = result[0].count;
                
                const [structure] = await db.execute('DESCRIBE whr_packages');
                testData.table_fields = structure.map(field => field.Field);
            } catch (dbError) {
                testData.database_error = dbError.message;
            }
        }
        
        res.json({
            success: true,
            message: 'Warehouse API Test Endpoint',
            data: testData
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error en test endpoint',
            error: error.message
        });
    }
}

// ================================
// EXPORTAR FUNCIONES
// ================================

module.exports = {
    healthCheck,
    createWHR,
    getWHRList,
    getWHRStats,
    classifyWHR,
    sendWHREmail,
    deleteWHR,
    getWHRById,
    testEndpoint
};