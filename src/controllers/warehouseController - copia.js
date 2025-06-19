// src/controllers/warehouseController.js - CORREGIDO PARA LISTA WHR
const { pool, getNextWHRNumber, calculateCAMCAMetrics, DatabaseUtils, executeTransaction } = require('../config/database');

class WarehouseController {
    
    // ============================================
    // CREAR NUEVO WHR
    // ============================================
    static async createWHR(req, res) {
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
            if (!trackingNumber || !receivedBy || !carrier || !shipperName || !consigneeName || !content || !weight || !length || !width || !height) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos los campos obligatorios deben ser completados'
                });
            }

            // Generar número WHR automático
            const whrNumber = await getNextWHRNumber();

            // Calcular métricas CAMCA
            const metrics = await calculateCAMCAMetrics(
                parseFloat(length), 
                parseFloat(width), 
                parseFloat(height)
            );

            // Insertar WHR en la base de datos
            const insertQuery = `
                INSERT INTO whr_packages (
                    whr_number, tracking_number, arrival_date, received_by, carrier,
                    shipper_name, shipper_company, shipper_address, shipper_phone,
                    consignee_name, consignee_company, consignee_address, consignee_phone, consignee_email,
                    content, pieces, weight, length_inches, width_inches, height_inches,
                    volume_cubic_feet, volume_weight, invoice_number, declared_value,
                    po_number, departure_date, transport, estimated_arrival_cr, notes
                ) VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await pool.execute(insertQuery, [
                whrNumber, trackingNumber, receivedBy, carrier,
                shipperName, shipperCompany || '', shipperAddress, shipperPhone || '',
                consigneeName, consigneeCompany || '', consigneeAddress, consigneePhone || '', consigneeEmail || '',
                content, parseInt(pieces) || 1, parseFloat(weight),
                parseFloat(length), parseFloat(width), parseFloat(height),
                metrics.volume, metrics.volume_weight,
                invoiceNumber || '', parseFloat(declaredValue) || 0,
                poNumber || '', departureDate || null, transport || 'air',
                estimatedArrivalCR || null, notes || ''
            ]);

            // Obtener el WHR creado
            const [createdWHR] = await pool.execute(
                'SELECT * FROM whr_packages WHERE id = ?',
                [result.insertId]
            );

            console.log(`✅ WHR creado: ${whrNumber}`);

            res.status(201).json({
                success: true,
                message: 'WHR creado exitosamente',
                data: {
                    whr: createdWHR[0],
                    whrNumber: whrNumber,
                    calculatedMetrics: metrics
                }
            });

        } catch (error) {
            console.error('Error creando WHR:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // ============================================
    // OBTENER LISTA DE WHR (CORREGIDO)
    // ============================================
    static async getWHRList(req, res) {
        try {
            const { 
                page = 1, 
                limit = 50, 
                search = '', 
                classification = '', 
                status = '',
                dateFrom = '',
                dateTo = '' 
            } = req.query;

            let whereConditions = [];
            let queryParams = [];

            // Búsqueda por texto
            if (search) {
                whereConditions.push(`(
                    whr_number LIKE ? OR 
                    tracking_number LIKE ? OR 
                    consignee_name LIKE ? OR 
                    shipper_name LIKE ?
                )`);
                const searchTerm = `%${search}%`;
                queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }

            // Filtro por clasificación
            if (classification) {
                whereConditions.push('classification = ?');
                queryParams.push(classification);
            }

            // Filtro por estado
            if (status) {
                whereConditions.push('status = ?');
                queryParams.push(status);
            }

            // Filtro por fechas
            if (dateFrom) {
                whereConditions.push('arrival_date >= ?');
                queryParams.push(dateFrom);
            }
            if (dateTo) {
                whereConditions.push('arrival_date <= ?');
                queryParams.push(dateTo);
            }

            const whereClause = whereConditions.length > 0 ? 
                'WHERE ' + whereConditions.join(' AND ') : '';

            // Consulta principal con paginación (usando tabla directa en lugar de vista)
            const offset = (parseInt(page) - 1) * parseInt(limit);
            const mainQuery = `
                SELECT 
                    id, whr_number, tracking_number, arrival_date, 
                    received_by, carrier, shipper_name, shipper_company,
                    consignee_name, consignee_company, consignee_address,
                    content, pieces, weight, length_inches, width_inches, height_inches,
                    volume_cubic_feet, volume_weight, classification, status,
                    email_sent, created_at,
                    CASE 
                        WHEN classification = 'pending' THEN 'Pendiente'
                        WHEN classification = 'awb' THEN 'AWB (Aéreo)'
                        WHEN classification = 'bl' THEN 'BL (Marítimo)'
                    END as classification_display,
                    CASE 
                        WHEN status = 'en_miami' THEN 'En Miami'
                        WHEN status = 'por_aire' THEN 'Por Aire'
                        WHEN status = 'por_mar' THEN 'Por Mar'
                        WHEN status = 'en_transito' THEN 'En Tránsito'
                        WHEN status = 'entregado' THEN 'Entregado'
                    END as status_display
                FROM whr_packages 
                ${whereClause}
                ORDER BY arrival_date DESC, created_at DESC
                LIMIT ? OFFSET ?
            `;

            const [whrList] = await pool.execute(mainQuery, [...queryParams, parseInt(limit), offset]);

            // Contar total para paginación
            const countQuery = `
                SELECT COUNT(*) as total FROM whr_packages 
                ${whereClause}
            `;
            const [countResult] = await pool.execute(countQuery, queryParams);
            const total = countResult[0].total;

            console.log(`📋 Lista WHR obtenida: ${whrList.length} registros`);

            res.json({
                success: true,
                data: {
                    whrList,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / parseInt(limit)),
                        totalItems: total,
                        itemsPerPage: parseInt(limit)
                    },
                    filters: {
                        search,
                        classification,
                        status,
                        dateFrom,
                        dateTo
                    }
                }
            });

        } catch (error) {
            console.error('Error obteniendo lista WHR:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo lista de WHR',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // ============================================
    // OBTENER WHR POR ID
    // ============================================
    static async getWHRById(req, res) {
        try {
            const { id } = req.params;

            // Obtener WHR básico
            const [whrResult] = await pool.execute(
                'SELECT * FROM whr_packages WHERE id = ?',
                [id]
            );

            if (whrResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'WHR no encontrado'
                });
            }

            // Obtener eventos de tracking
            const [trackingEvents] = await pool.execute(`
                SELECT 
                    event_type, event_description, event_location, 
                    created_by, created_at, metadata
                FROM whr_tracking_events 
                WHERE whr_package_id = ? 
                ORDER BY created_at ASC
            `, [id]);

            res.json({
                success: true,
                data: {
                    whr: whrResult[0],
                    trackingEvents
                }
            });

        } catch (error) {
            console.error('Error obteniendo WHR:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo WHR'
            });
        }
    }

    // ============================================
    // CLASIFICAR WHR (AWB/BL)
    // ============================================
    static async classifyWHR(req, res) {
        try {
            const { id } = req.params;
            const { classification, transport, notes } = req.body;

            if (!['awb', 'bl'].includes(classification)) {
                return res.status(400).json({
                    success: false,
                    message: 'Clasificación debe ser "awb" o "bl"'
                });
            }

            // Actualizar clasificación
            const [result] = await pool.execute(`
                UPDATE whr_packages 
                SET classification = ?, transport = ?, notes = ?
                WHERE id = ?
            `, [classification, transport || (classification === 'awb' ? 'air' : 'sea'), notes || '', id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'WHR no encontrado'
                });
            }

            // Obtener WHR actualizado
            const [updatedWHR] = await pool.execute(
                'SELECT * FROM whr_packages WHERE id = ?',
                [id]
            );

            console.log(`🏷️ WHR ${id} clasificado como ${classification.toUpperCase()}`);

            res.json({
                success: true,
                message: 'WHR clasificado exitosamente',
                data: {
                    whr: updatedWHR[0]
                }
            });

        } catch (error) {
            console.error('Error clasificando WHR:', error);
            res.status(500).json({
                success: false,
                message: 'Error clasificando WHR'
            });
        }
    }

    // ============================================
    // MARCAR EMAIL COMO ENVIADO
    // ============================================
    static async markEmailSent(req, res) {
        try {
            const { id } = req.params;
            const { emailData } = req.body;

            // Actualizar estado de email
            const [result] = await pool.execute(`
                UPDATE whr_packages 
                SET email_sent = TRUE 
                WHERE id = ?
            `, [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'WHR no encontrado'
                });
            }

            console.log(`📧 Email marcado como enviado para WHR ${id}`);

            res.json({
                success: true,
                message: 'Email marcado como enviado'
            });

        } catch (error) {
            console.error('Error marcando email enviado:', error);
            res.status(500).json({
                success: false,
                message: 'Error marcando email como enviado'
            });
        }
    }

    // ============================================
    // OBTENER ESTADÍSTICAS DASHBOARD
    // ============================================
    static async getWHRStats(req, res) {
        try {
            const { days = 30 } = req.query;

            // Estadísticas principales usando consulta directa
            const [statsResult] = await pool.execute(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN classification = 'pending' THEN 1 END) as pending,
                    COUNT(CASE WHEN classification = 'awb' THEN 1 END) as awb,
                    COUNT(CASE WHEN classification = 'bl' THEN 1 END) as bl,
                    COUNT(CASE WHEN email_sent = FALSE THEN 1 END) as emails_pending,
                    COUNT(CASE WHEN status = 'en_miami' THEN 1 END) as in_miami,
                    COALESCE(AVG(weight), 0) as avg_weight,
                    COALESCE(AVG(volume_cubic_feet), 0) as avg_volume,
                    COALESCE(SUM(declared_value), 0) as total_value,
                    COALESCE(SUM(pieces), 0) as total_pieces
                FROM whr_packages 
                WHERE arrival_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            `, [parseInt(days)]);

            const stats = statsResult[0];

            // Próximo número WHR
            const nextWHRNumber = await getNextWHRNumber();

            // Último WHR creado
            const [lastWHR] = await pool.execute(`
                SELECT created_at FROM whr_packages 
                ORDER BY created_at DESC LIMIT 1
            `);

            // WHR pendientes de email
            const [pendingEmails] = await pool.execute(`
                SELECT whr_number, consignee_name, consignee_email 
                FROM whr_packages 
                WHERE email_sent = FALSE 
                ORDER BY arrival_date ASC
                LIMIT 5
            `);

            console.log(`📊 Estadísticas calculadas: ${stats.total} WHR total`);

            res.json({
                success: true,
                data: {
                    stats: {
                        ...stats,
                        next_whr_number: nextWHRNumber,
                        last_whr_created: lastWHR.length > 0 ? lastWHR[0].created_at : null,
                        date_range_days: parseInt(days)
                    },
                    dailyStats: [], // TODO: implementar si se necesita
                    pendingEmails: pendingEmails.slice(0, 5)
                }
            });

        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo estadísticas',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // ============================================
    // BUSCAR WHR
    // ============================================
    static async searchWHR(req, res) {
        try {
            const { q } = req.query;

            if (!q || q.length < 3) {
                return res.status(400).json({
                    success: false,
                    message: 'Término de búsqueda debe tener al menos 3 caracteres'
                });
            }

            const [results] = await pool.execute(`
                SELECT whr_number, tracking_number, consignee_name, shipper_name, 
                       classification, status, created_at
                FROM whr_packages
                WHERE whr_number LIKE ? 
                   OR tracking_number LIKE ? 
                   OR consignee_name LIKE ? 
                   OR shipper_name LIKE ?
                ORDER BY created_at DESC
                LIMIT 10
            `, [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]);

            res.json({
                success: true,
                data: {
                    results,
                    count: results.length,
                    searchTerm: q
                }
            });

        } catch (error) {
            console.error('Error buscando WHR:', error);
            res.status(500).json({
                success: false,
                message: 'Error en búsqueda'
            });
        }
    }

    // ============================================
    // TRACKING PÚBLICO
    // ============================================
    static async publicTracking(req, res) {
        try {
            const { tracking } = req.params;

            // Buscar por tracking number o WHR number
            const [whrResult] = await pool.execute(`
                SELECT 
                    whr_number, tracking_number, status, classification,
                    consignee_name, arrival_date, departure_date, 
                    estimated_arrival_cr
                FROM whr_packages 
                WHERE tracking_number = ? OR whr_number = ?
            `, [tracking, tracking]);

            if (whrResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Número de tracking no encontrado'
                });
            }

            // Obtener eventos de tracking públicos
            const [trackingEvents] = await pool.execute(`
                SELECT 
                    event_type, event_description, event_location, created_at
                FROM whr_tracking_events 
                WHERE whr_package_id = (
                    SELECT id FROM whr_packages 
                    WHERE tracking_number = ? OR whr_number = ?
                )
                ORDER BY created_at ASC
            `, [tracking, tracking]);

            res.json({
                success: true,
                data: {
                    whr: whrResult[0],
                    events: trackingEvents
                }
            });

        } catch (error) {
            console.error('Error en tracking público:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo información de tracking'
            });
        }
    }

    // ============================================
    // OTROS MÉTODOS (placeholder)
    // ============================================
    static async updateWHRStatus(req, res) {
        res.json({ success: true, message: 'Método updateWHRStatus pendiente de implementar' });
    }

    static async deleteWHR(req, res) {
        res.json({ success: true, message: 'Método deleteWHR pendiente de implementar' });
    }
}

module.exports = WarehouseController;