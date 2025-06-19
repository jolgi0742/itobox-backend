-- database-schema-camca.sql - SCHEMA COMPLETO ITOBOX + CAMCA
-- Reemplazar tu schema actual con este archivo completo

CREATE DATABASE IF NOT EXISTS itobox_courier 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE itobox_courier;

-- ===================================
-- TABLAS EXISTENTES ITOBOX (Mantener)
-- ===================================

-- Tabla Usuarios (Tu estructura existente)
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'courier', 'client', 'operator') NOT NULL DEFAULT 'client',
    phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
);

-- Tabla Clientes (Tu estructura existente)
CREATE TABLE IF NOT EXISTS clients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    company_name VARCHAR(255),
    tax_id VARCHAR(50),
    business_type VARCHAR(100),
    credit_limit DECIMAL(10,2) DEFAULT 0.00,
    current_balance DECIMAL(10,2) DEFAULT 0.00,
    preferred_pickup_address TEXT,
    billing_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_clients_user (user_id)
);

-- Tabla Paquetes (Tu estructura existente + campos CAMCA)
CREATE TABLE IF NOT EXISTS packages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tracking_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INT,
    sender_name VARCHAR(255) NOT NULL,
    sender_phone VARCHAR(20),
    sender_address TEXT NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(20),
    recipient_address TEXT NOT NULL,
    weight DECIMAL(8,2) NOT NULL,
    dimensions JSON,
    declared_value DECIMAL(10,2) DEFAULT 0.00,
    service_type ENUM('express', 'standard', 'economy') DEFAULT 'standard',
    status ENUM('pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'returned') DEFAULT 'pending',
    pickup_date DATE,
    estimated_delivery DATE,
    actual_delivery DATE,
    delivery_instructions TEXT,
    special_handling JSON,
    
    -- Campos CAMCA agregados
    courier_service VARCHAR(100),
    content_description TEXT,
    pieces INT DEFAULT 1,
    length_inches DECIMAL(8,2),
    width_inches DECIMAL(8,2),
    height_inches DECIMAL(8,2),
    invoice_number VARCHAR(100),
    po_number VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX idx_packages_tracking (tracking_number),
    INDEX idx_packages_client (client_id),
    INDEX idx_packages_status (status)
);

-- Tabla Tracking Events (Tu estructura existente)
CREATE TABLE IF NOT EXISTS tracking_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    package_id INT NOT NULL,
    event_type ENUM('created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'exception') NOT NULL,
    location VARCHAR(255),
    description TEXT,
    event_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id INT,
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id),
    INDEX idx_tracking_package (package_id)
);

-- ===================================
-- NUEVA TABLA CAMCA - WHR SYSTEM
-- ===================================

-- Tabla principal de Warehouse Receipts (CAMCA)
CREATE TABLE warehouse_receipts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    whr_number VARCHAR(50) UNIQUE NOT NULL,
    package_id INT,
    tracking_number VARCHAR(100) NOT NULL,
    arrival_date DATE DEFAULT (CURRENT_DATE),
    received_by VARCHAR(255) NOT NULL,
    status ENUM('en Miami', 'por aire', 'por mar', 'en tránsito', 'entregado') DEFAULT 'en Miami',
    
    -- Shipper Information (CAMCA required)
    shipper_name VARCHAR(255) NOT NULL,
    shipper_company VARCHAR(255),
    shipper_address TEXT NOT NULL,
    shipper_phone VARCHAR(50),
    
    -- Consignee Information (CAMCA required)
    consignee_name VARCHAR(255) NOT NULL,
    consignee_company VARCHAR(255),
    consignee_address TEXT NOT NULL,
    consignee_phone VARCHAR(50),
    consignee_email VARCHAR(255) NOT NULL,
    
    -- Package Details (CAMCA specific)
    carrier VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    pieces INT NOT NULL DEFAULT 1,
    weight_lb DECIMAL(8,2) NOT NULL,
    length_in DECIMAL(8,2) NOT NULL,
    width_in DECIMAL(8,2) NOT NULL,
    height_in DECIMAL(8,2) NOT NULL,
    
    -- Calculated fields (CAMCA formulas)
    volume_ft3 DECIMAL(10,4) GENERATED ALWAYS AS (
        (length_in * width_in * height_in) * 0.000578746
    ) STORED,
    volume_weight_vlb DECIMAL(10,2) GENERATED ALWAYS AS (
        ((length_in * width_in * height_in) * 0.000578746) * 10.4
    ) STORED,
    
    -- Commercial Information (CAMCA required)
    invoice_number VARCHAR(100),
    declared_value DECIMAL(10,2) DEFAULT 0.00,
    po_number VARCHAR(100),
    departure_date DATE,
    transport_type ENUM('air', 'sea') DEFAULT 'air',
    estimated_arrival_cr DATE,
    notes TEXT,
    
    -- CAMCA Control Fields
    classification ENUM('pending', 'awb', 'bl') DEFAULT 'pending',
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_date TIMESTAMP NULL,
    manifest_id INT NULL,
    
    -- Standard timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL,
    
    -- Indexes for performance
    INDEX idx_whr_number (whr_number),
    INDEX idx_whr_tracking (tracking_number),
    INDEX idx_whr_consignee_email (consignee_email),
    INDEX idx_whr_classification (classification),
    INDEX idx_whr_status (status),
    INDEX idx_whr_arrival_date (arrival_date),
    INDEX idx_whr_transport_type (transport_type)
);

-- Tabla de Manifiestos CAMCA
CREATE TABLE manifests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    manifest_number VARCHAR(50) UNIQUE NOT NULL,
    manifest_type ENUM('awb', 'bl') NOT NULL,
    transport_type ENUM('air', 'sea') NOT NULL,
    carrier_name VARCHAR(255),
    departure_date DATE,
    estimated_arrival_date DATE,
    origin_port VARCHAR(100) DEFAULT 'MIA',
    destination_port VARCHAR(100) DEFAULT 'SJO',
    status ENUM('open', 'closed', 'shipped', 'arrived') DEFAULT 'open',
    total_pieces INT DEFAULT 0,
    total_weight_kg DECIMAL(10,2) DEFAULT 0.00,
    total_volume_m3 DECIMAL(10,4) DEFAULT 0.00,
    notes TEXT,
    created_by_user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by_user_id) REFERENCES users(id),
    INDEX idx_manifest_number (manifest_number),
    INDEX idx_manifest_type (manifest_type),
    INDEX idx_manifest_status (status)
);

-- Tabla de relación WHR-Manifest
CREATE TABLE manifest_whr_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    manifest_id INT NOT NULL,
    whr_id INT NOT NULL,
    sequence_number INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (manifest_id) REFERENCES manifests(id) ON DELETE CASCADE,
    FOREIGN KEY (whr_id) REFERENCES warehouse_receipts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_manifest_whr (manifest_id, whr_id),
    INDEX idx_manifest_items_manifest (manifest_id),
    INDEX idx_manifest_items_whr (whr_id)
);

-- ===================================
-- TRIGGERS PARA WHR NUMBER AUTOMÁTICO
-- ===================================

DELIMITER $$

-- Trigger para generar WHR number automático
CREATE TRIGGER generate_whr_number 
BEFORE INSERT ON warehouse_receipts 
FOR EACH ROW 
BEGIN
    DECLARE next_sequence INT DEFAULT 1;
    DECLARE date_prefix VARCHAR(6);
    
    IF NEW.whr_number IS NULL OR NEW.whr_number = '' THEN
        -- Formato: WHRyymmdd#### (ej: WHR2412150001)
        SET date_prefix = DATE_FORMAT(NOW(), '%y%m%d');
        
        -- Obtener siguiente secuencia del día
        SELECT COALESCE(MAX(CAST(SUBSTRING(whr_number, 10) AS UNSIGNED)), 0) + 1
        INTO next_sequence
        FROM warehouse_receipts 
        WHERE DATE(created_at) = CURDATE()
        AND whr_number LIKE CONCAT('WHR', date_prefix, '%');
        
        SET NEW.whr_number = CONCAT(
            'WHR',
            date_prefix,
            LPAD(next_sequence, 4, '0')
        );
    END IF;
    
    -- Auto-calcular estimated_arrival_cr si no se proporciona
    IF NEW.estimated_arrival_cr IS NULL AND NEW.departure_date IS NOT NULL THEN
        IF NEW.transport_type = 'air' THEN
            SET NEW.estimated_arrival_cr = DATE_ADD(NEW.departure_date, INTERVAL 2 DAY);
        ELSE
            SET NEW.estimated_arrival_cr = DATE_ADD(NEW.departure_date, INTERVAL 14 DAY);
        END IF;
    END IF;
END$$

-- Trigger para generar Manifest number automático
CREATE TRIGGER generate_manifest_number 
BEFORE INSERT ON manifests 
FOR EACH ROW 
BEGIN
    DECLARE next_sequence INT DEFAULT 1;
    DECLARE prefix VARCHAR(10);
    
    IF NEW.manifest_number IS NULL OR NEW.manifest_number = '' THEN
        -- Formato: AWB241215001 o BL241215001
        SET prefix = CASE 
            WHEN NEW.manifest_type = 'awb' THEN 'AWB'
            ELSE 'BL'
        END;
        
        SELECT COALESCE(MAX(CAST(SUBSTRING(manifest_number, 10) AS UNSIGNED)), 0) + 1
        INTO next_sequence
        FROM manifests 
        WHERE DATE(created_at) = CURDATE()
        AND manifest_type = NEW.manifest_type;
        
        SET NEW.manifest_number = CONCAT(
            prefix,
            DATE_FORMAT(NOW(), '%y%m%d'),
            LPAD(next_sequence, 3, '0')
        );
    END IF;
END$$

-- Trigger para actualizar totales del manifiesto
CREATE TRIGGER update_manifest_totals
AFTER INSERT ON manifest_whr_items
FOR EACH ROW
BEGIN
    UPDATE manifests m
    SET 
        total_pieces = (
            SELECT COALESCE(SUM(w.pieces), 0) 
            FROM manifest_whr_items mi 
            JOIN warehouse_receipts w ON mi.whr_id = w.id 
            WHERE mi.manifest_id = m.id
        ),
        total_weight_kg = (
            SELECT COALESCE(SUM(w.weight_lb * 0.453592), 0) 
            FROM manifest_whr_items mi 
            JOIN warehouse_receipts w ON mi.whr_id = w.id 
            WHERE mi.manifest_id = m.id
        ),
        total_volume_m3 = (
            SELECT COALESCE(SUM(w.volume_ft3 * 0.0283168), 0) 
            FROM manifest_whr_items mi 
            JOIN warehouse_receipts w ON mi.whr_id = w.id 
            WHERE mi.manifest_id = m.id
        )
    WHERE m.id = NEW.manifest_id;
END$$

DELIMITER ;

-- ===================================
-- DATOS DE PRUEBA INICIALES
-- ===================================

-- Usuario admin por defecto
INSERT IGNORE INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified) 
VALUES 
('admin@itobox.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj7tJ5s.qODe', 'Admin', 'Sistema', 'admin', TRUE, TRUE),
('operator@itobox.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj7tJ5s.qODe', 'Operador', 'CAMCA', 'operator', TRUE, TRUE);

-- Cliente de ejemplo
INSERT IGNORE INTO clients (user_id, company_name, tax_id, business_type, credit_limit)
SELECT u.id, 'CAMCA Express', '3-101-123456', 'Courier Services', 10000.00
FROM users u WHERE u.email = 'admin@itobox.com' LIMIT 1;

-- WHR de ejemplo
INSERT IGNORE INTO warehouse_receipts (
    tracking_number, received_by, shipper_name, shipper_company, shipper_address, shipper_phone,
    consignee_name, consignee_company, consignee_address, consignee_phone, consignee_email,
    carrier, content, pieces, weight_lb, length_in, width_in, height_in,
    invoice_number, declared_value, po_number, departure_date, transport_type, notes
) VALUES (
    '9400111899560786939683',
    'CRI/SJO EXPRESS Administrador',
    'AMERICAN CLOSEOUTS',
    'AMERICAN CLOSEOUTS',
    '172 TRADE STREET, LEXINGTON, KY - 40511',
    '000-000-0000',
    'JORGE CAMBRONERO',
    '',
    'SAN JOSE, 2440-2357, SAN JOSE - COSTA RICA',
    '2440-2357',
    'jorge@email.com',
    'PAQUETERIA EXPRESS',
    'BACKPACK FOR GIRL (MOCHILA DE NIÑA)',
    1,
    1.0,
    15.0,
    10.0,
    3.0,
    'INV-2024-001',
    0.00,
    'PO-2024-001',
    CURDATE() + INTERVAL 5 DAY,
    'air',
    'Paquete de prueba CAMCA'
);

-- ===================================
-- VISTAS ÚTILES PARA REPORTES
-- ===================================

-- Vista de WHR con información calculada
CREATE OR REPLACE VIEW vw_whr_complete AS
SELECT 
    w.*,
    CASE 
        WHEN w.volume_weight_vlb > w.weight_lb THEN w.volume_weight_vlb 
        ELSE w.weight_lb 
    END as billable_weight,
    DATEDIFF(w.estimated_arrival_cr, w.departure_date) as transit_days,
    CASE w.classification
        WHEN 'awb' THEN 'Aéreo'
        WHEN 'bl' THEN 'Marítimo'
        ELSE 'Pendiente'
    END as classification_text,
    CASE w.status
        WHEN 'en Miami' THEN 'En Miami'
        WHEN 'por aire' THEN 'Por Aire'
        WHEN 'por mar' THEN 'Por Mar'
        WHEN 'en tránsito' THEN 'En Tránsito'
        WHEN 'entregado' THEN 'Entregado'
    END as status_text
FROM warehouse_receipts w;

-- Vista de estadísticas diarias
CREATE OR REPLACE VIEW vw_daily_whr_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_whr,
    COUNT(CASE WHEN classification = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN classification = 'awb' THEN 1 END) as awb,
    COUNT(CASE WHEN classification = 'bl' THEN 1 END) as bl,
    COUNT(CASE WHEN email_sent = TRUE THEN 1 END) as emails_sent,
    SUM(pieces) as total_pieces,
    SUM(weight_lb) as total_weight_lb,
    SUM(volume_ft3) as total_volume_ft3,
    AVG(declared_value) as avg_declared_value
FROM warehouse_receipts
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ===================================
-- PROCEDIMIENTOS ALMACENADOS ÚTILES
-- ===================================

DELIMITER $$

-- Procedimiento para clasificar múltiples WHR
CREATE PROCEDURE classify_whr_batch(
    IN p_whr_ids TEXT,
    IN p_classification ENUM('awb', 'bl'),
    IN p_user_id INT
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE whr_id INT;
    DECLARE whr_cursor CURSOR FOR 
        SELECT CAST(TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(p_whr_ids, ',', numbers.n), ',', -1)) AS UNSIGNED) as id
        FROM (SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) numbers
        WHERE CHAR_LENGTH(p_whr_ids) - CHAR_LENGTH(REPLACE(p_whr_ids, ',', '')) >= numbers.n - 1;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN whr_cursor;
    
    read_loop: LOOP
        FETCH whr_cursor INTO whr_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        UPDATE warehouse_receipts 
        SET classification = p_classification,
            updated_at = NOW()
        WHERE id = whr_id;
        
    END LOOP;
    
    CLOSE whr_cursor;
END$$

-- Función para obtener siguiente WHR number
CREATE FUNCTION get_next_whr_number() 
RETURNS VARCHAR(50)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE next_sequence INT DEFAULT 1;
    DECLARE date_prefix VARCHAR(6);
    DECLARE result VARCHAR(50);
    
    SET date_prefix = DATE_FORMAT(NOW(), '%y%m%d');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(whr_number, 10) AS UNSIGNED)), 0) + 1
    INTO next_sequence
    FROM warehouse_receipts 
    WHERE DATE(created_at) = CURDATE()
    AND whr_number LIKE CONCAT('WHR', date_prefix, '%');
    
    SET result = CONCAT('WHR', date_prefix, LPAD(next_sequence, 4, '0'));
    
    RETURN result;
END$$

DELIMITER ;

-- ===================================
-- GRANTS Y PERMISOS
-- ===================================

-- Crear usuario para la aplicación si no existe
-- CREATE USER IF NOT EXISTS 'itobox_app'@'localhost' IDENTIFIED BY 'secure_password_here';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON itobox_courier.* TO 'itobox_app'@'localhost';
-- FLUSH PRIVILEGES;

-- ===================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ===================================

/*
DOCUMENTACIÓN DEL SCHEMA CAMCA:

1. TABLA warehouse_receipts:
   - Núcleo del sistema CAMCA
   - Campos calculados automáticamente: volume_ft3, volume_weight_vlb
   - WHR number auto-generado: WHRyymmdd####
   - Estimated arrival CR calculado automáticamente

2. FÓRMULAS CAMCA IMPLEMENTADAS:
   - Volumen (ft³) = (L × W × H en pulgadas) × 0.000578746
   - Peso Volumétrico (vlb) = Volumen ft³ × 10.4
   - Peso facturable = MAX(peso real, peso volumétrico)

3. FLUJO CAMCA:
   - Recepción → WHR automático
   - Email automático → consignee notificado
   - Clasificación → AWB/BL assignment
   - Manifiesto → agrupación para envío

4. TRIGGERS AUTOMÁTICOS:
   - WHR number generation
   - Manifest number generation  
   - Totales de manifiesto
   - Fechas estimadas

5. VISTAS Y REPORTES:
   - vw_whr_complete: WHR con campos calculados
   - vw_daily_whr_stats: Estadísticas diarias
   - Procedimientos para operaciones batch

6. ÍNDICES OPTIMIZADOS:
   - Búsquedas por WHR number, tracking, email
   - Filtros por clasificación, estado, fecha
   - Rendimiento optimizado para reportes

Este schema mantiene compatibilidad completa con ITOBOX existente
y agrega funcionalidad CAMCA específica sin conflictos.
*/