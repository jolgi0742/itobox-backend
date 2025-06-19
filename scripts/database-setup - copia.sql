-- itobox-backend/scripts/database-setup.sql
-- Script completo de configuración de base de datos para ITOBOX

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS itobox_courier 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE itobox_courier;

-- Crear usuario específico para la aplicación
CREATE USER IF NOT EXISTS 'itobox_user'@'localhost' IDENTIFIED BY 'secure_password_2024';
GRANT ALL PRIVILEGES ON itobox_courier.* TO 'itobox_user'@'localhost';
FLUSH PRIVILEGES;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'agent', 'client') NOT NULL DEFAULT 'client',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    company VARCHAR(255),
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_two_factor_enabled BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    customer_code VARCHAR(20) UNIQUE NOT NULL,
    company_name VARCHAR(255),
    contact_person VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address JSON NOT NULL,
    billing_info JSON,
    miami_address JSON,
    preferences JSON,
    credit_limit DECIMAL(10,2) DEFAULT 0.00,
    current_balance DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_customer_code (customer_code),
    INDEX idx_status (status),
    INDEX idx_contact_person (contact_person)
);

-- Tabla de paquetes
CREATE TABLE IF NOT EXISTS packages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    package_code VARCHAR(30) UNIQUE NOT NULL,
    client_id INT NOT NULL,
    prealert_id INT NULL,
    tracking_number VARCHAR(100) NOT NULL,
    courier ENUM('UPS', 'FedEx', 'DHL', 'USPS', 'Other') NOT NULL,
    origin_info JSON,
    destination_info JSON NOT NULL,
    package_details JSON NOT NULL,
    customs_info JSON,
    shipping_cost DECIMAL(10,2),
    insurance_value DECIMAL(10,2),
    status ENUM('pending', 'received', 'processing', 'in_transit', 'delivered', 'exception', 'returned') DEFAULT 'pending',
    priority ENUM('standard', 'express', 'urgent') DEFAULT 'standard',
    special_instructions TEXT,
    photos JSON,
    received_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    estimated_delivery TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
    INDEX idx_package_code (package_code),
    INDEX idx_client_id (client_id),
    INDEX idx_tracking_number (tracking_number),
    INDEX idx_status (status),
    INDEX idx_courier (courier),
    INDEX idx_created_at (created_at)
);

-- Tabla de eventos de tracking
CREATE TABLE IF NOT EXISTS tracking_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    package_id INT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    description TEXT,
    location JSON,
    event_datetime TIMESTAMP NOT NULL,
    source ENUM('api', 'webhook', 'manual', 'system') NOT NULL,
    source_details JSON,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
    INDEX idx_package_id (package_id),
    INDEX idx_event_datetime (event_datetime),
    INDEX idx_source (source),
    INDEX idx_status (status)
);

-- Tabla de prealertas
CREATE TABLE IF NOT EXISTS prealerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id INT NOT NULL,
    tracking_number VARCHAR(100) NOT NULL,
    courier ENUM('UPS', 'FedEx', 'DHL', 'USPS', 'Other') NOT NULL,
    description TEXT NOT NULL,
    estimated_value DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    special_instructions TEXT,
    status ENUM('pending', 'received', 'processed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
    INDEX idx_client_id (client_id),
    INDEX idx_tracking_number (tracking_number),
    INDEX idx_status (status)
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON,
    channels JSON,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    INDEX idx_expires_at (expires_at)
);

-- Tabla de logs de auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_created_at (created_at)
);

-- Tabla de cache de APIs de couriers
CREATE TABLE IF NOT EXISTS courier_api_cache (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tracking_number VARCHAR(100) NOT NULL,
    courier VARCHAR(20) NOT NULL,
    response_data JSON NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_tracking (tracking_number, courier),
    INDEX idx_expires_at (expires_at)
);

-- Tabla de webhook logs
CREATE TABLE IF NOT EXISTS webhook_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    webhook_type VARCHAR(50) NOT NULL,
    payload JSON NOT NULL,
    headers JSON,
    response_status INT,
    response_data JSON,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_webhook_type (webhook_type),
    INDEX idx_processed_at (processed_at)
);

-- Tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS system_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSON NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_config_key (config_key),
    INDEX idx_is_public (is_public)
);

-- Tabla de sesiones (opcional, para manejo de sesiones en BD)
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id INT,
    data JSON,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

-- Tabla de archivos subidos
CREATE TABLE IF NOT EXISTS uploaded_files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    original_name VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size INT NOT NULL,
    path VARCHAR(500) NOT NULL,
    related_type VARCHAR(50),
    related_id INT,
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_related (related_type, related_id),
    INDEX idx_uploaded_by (uploaded_by)
);

-- Vista para packages con información del cliente
CREATE OR REPLACE VIEW packages_with_client AS
SELECT 
    p.*,
    c.customer_code,
    c.contact_person,
    c.company_name,
    c.phone as client_phone,
    JSON_UNQUOTE(JSON_EXTRACT(c.address, '$.city')) as client_city,
    JSON_UNQUOTE(JSON_EXTRACT(c.address, '$.country')) as client_country
FROM packages p
JOIN clients c ON p.client_id = c.id;

-- Vista para métricas del dashboard
CREATE OR REPLACE VIEW dashboard_metrics AS
SELECT 
    -- Métricas de paquetes
    COUNT(*) as total_packages,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_packages,
    COUNT(CASE WHEN status = 'in_transit' THEN 1 END) as in_transit_packages,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_packages,
    COUNT(CASE WHEN status = 'exception' THEN 1 END) as exception_packages,
    
    -- Métricas por courier
    COUNT(CASE WHEN courier = 'UPS' THEN 1 END) as ups_packages,
    COUNT(CASE WHEN courier = 'FedEx' THEN 1 END) as fedex_packages,
    COUNT(CASE WHEN courier = 'DHL' THEN 1 END) as dhl_packages,
    COUNT(CASE WHEN courier = 'USPS' THEN 1 END) as usps_packages,
    
    -- Métricas financieras
    SUM(shipping_cost) as total_shipping_cost,
    AVG(shipping_cost) as average_shipping_cost,
    SUM(insurance_value) as total_insurance_value,
    
    -- Métricas de tiempo
    AVG(TIMESTAMPDIFF(HOUR, created_at, delivered_at)) as avg_delivery_time_hours
FROM packages
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Procedimiento para limpiar cache expirado
DELIMITER //
CREATE PROCEDURE CleanExpiredCache()
BEGIN
    DELETE FROM courier_api_cache WHERE expires_at < NOW();
    DELETE FROM sessions WHERE expires_at < NOW();
    DELETE FROM notifications WHERE expires_at IS NOT NULL AND expires_at < NOW();
END //
DELIMITER ;

-- Procedimiento para generar código de cliente
DELIMITER //
CREATE PROCEDURE GenerateCustomerCode(OUT new_code VARCHAR(20))
BEGIN
    DECLARE max_num INT DEFAULT 0;
    DECLARE code_exists INT DEFAULT 1;
    DECLARE attempts INT DEFAULT 0;
    
    WHILE code_exists = 1 AND attempts < 100 DO
        SELECT COALESCE(MAX(CAST(SUBSTRING(customer_code, 5) AS UNSIGNED)), 0) + 1 
        INTO max_num 
        FROM clients 
        WHERE customer_code REGEXP '^CLI-[0-9]+$';
        
        SET new_code = CONCAT('CLI-', LPAD(max_num, 3, '0'));
        
        SELECT COUNT(*) INTO code_exists 
        FROM clients 
        WHERE customer_code = new_code;
        
        SET attempts = attempts + 1;
    END WHILE;
    
    IF code_exists = 1 THEN
        SET new_code = CONCAT('CLI-', UNIX_TIMESTAMP());
    END IF;
END //
DELIMITER ;

-- Procedimiento para actualizar balance del cliente
DELIMITER //
CREATE PROCEDURE UpdateClientBalance(IN client_id INT, IN amount DECIMAL(10,2))
BEGIN
    UPDATE clients 
    SET current_balance = current_balance + amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = client_id;
END //
DELIMITER ;

-- Trigger para crear código de paquete automáticamente
DELIMITER //
CREATE TRIGGER before_package_insert 
BEFORE INSERT ON packages
FOR EACH ROW
BEGIN
    IF NEW.package_code IS NULL OR NEW.package_code = '' THEN
        DECLARE next_num INT;
        SELECT COALESCE(MAX(CAST(SUBSTRING(package_code, 5) AS UNSIGNED)), 0) + 1 
        INTO next_num 
        FROM packages 
        WHERE package_code REGEXP '^PKG-[0-9]+$';
        
        SET NEW.package_code = CONCAT('PKG-', LPAD(next_num, 7, '0'));
    END IF;
END //
DELIMITER ;

-- Trigger para logging de auditoría en packages
DELIMITER //
CREATE TRIGGER audit_package_update 
AFTER UPDATE ON packages
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (
        action, 
        resource_type, 
        resource_id, 
        old_values, 
        new_values
    ) VALUES (
        'UPDATE',
        'package',
        NEW.id,
        JSON_OBJECT(
            'status', OLD.status,
            'shipping_cost', OLD.shipping_cost,
            'received_at', OLD.received_at,
            'delivered_at', OLD.delivered_at
        ),
        JSON_OBJECT(
            'status', NEW.status,
            'shipping_cost', NEW.shipping_cost,
            'received_at', NEW.received_at,
            'delivered_at', NEW.delivered_at
        )
    );
END //
DELIMITER ;

-- Insertar configuración inicial del sistema
INSERT INTO system_config (config_key, config_value, description, is_public) VALUES
('app_name', '"ITOBOX Courier"', 'Nombre de la aplicación', true),
('app_version', '"3.0.0"', 'Versión de la aplicación', true),
('miami_address', '{"line1": "1234 Shipping Way", "line2": "Suite 100", "city": "Miami", "state": "FL", "zipCode": "33101", "country": "USA"}', 'Dirección de Miami para casilleros', false),
('notification_settings', '{"email_enabled": true, "push_enabled": true, "sms_enabled": false}', 'Configuración de notificaciones', false),
('courier_settings', '{"ups_enabled": true, "fedex_enabled": true, "dhl_enabled": true, "usps_enabled": true}', 'Configuración de couriers', false),
('business_hours', '{"start": "08:00", "end": "18:00", "timezone": "America/Costa_Rica", "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]}', 'Horario de atención', true)
ON DUPLICATE KEY UPDATE 
config_value = VALUES(config_value),
updated_at = CURRENT_TIMESTAMP;

-- Crear evento para limpieza automática (ejecutar cada día a las 2 AM)
SET GLOBAL event_scheduler = ON;

DELIMITER //
CREATE EVENT IF NOT EXISTS daily_cleanup
ON SCHEDULE EVERY 1 DAY
STARTS '2024-01-01 02:00:00'
DO
BEGIN
    CALL CleanExpiredCache();
    
    -- Limpiar logs antiguos (más de 90 días)
    DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
    DELETE FROM webhook_logs WHERE processed_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    -- Optimizar tablas
    OPTIMIZE TABLE packages;
    OPTIMIZE TABLE tracking_events;
    OPTIMIZE TABLE notifications;
END //
DELIMITER ;

-- Crear índices adicionales para mejor performance
CREATE INDEX idx_packages_status_created ON packages(status, created_at);
CREATE INDEX idx_packages_client_status ON packages(client_id, status);
CREATE INDEX idx_tracking_events_package_datetime ON tracking_events(package_id, event_datetime DESC);
CREATE INDEX idx_notifications_user_priority ON notifications(user_id, priority, created_at DESC);

-- Grants adicionales para el usuario de la aplicación
GRANT EXECUTE ON PROCEDURE itobox_courier.CleanExpiredCache TO 'itobox_user'@'localhost';
GRANT EXECUTE ON PROCEDURE itobox_courier.GenerateCustomerCode TO 'itobox_user'@'localhost';
GRANT EXECUTE ON PROCEDURE itobox_courier.UpdateClientBalance TO 'itobox_user'@'localhost';

-- Verificación final
SELECT 'Database setup completed successfully!' as status;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'itobox_courier';

-- Mostrar estructura de tablas principales
SHOW TABLES;

-- Insertar usuario administrador por defecto (password: admin123)
INSERT IGNORE INTO users (
    email, 
    password, 
    role, 
    first_name, 
    last_name, 
    is_email_verified,
    status
) VALUES (
    'admin@itobox.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
    'admin',
    'ITOBOX',
    'Administrator',
    true,
    'active'
);

-- Insertar algunos datos de prueba para desarrollo
INSERT IGNORE INTO users (email, password, role, first_name, last_name, phone, company, is_email_verified, status) VALUES
('agent@demo.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'agent', 'María', 'González', '+506-2222-3333', 'ITOBOX', true, 'active'),
('cliente@demo.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', 'Juan', 'Pérez', '+506-8888-9999', 'Mi Empresa S.A.', true, 'active');

-- Crear algunos clientes de ejemplo
CALL GenerateCustomerCode(@code1);
INSERT IGNORE INTO clients (customer_code, contact_person, phone, company_name, address, credit_limit, status) VALUES
(@code1, 'Juan Pérez', '+506-8888-9999', 'Mi Empresa S.A.', 
'{"street": "Avenida Central 123", "city": "San José", "state": "San José", "zipCode": "10101", "country": "Costa Rica"}', 
5000.00, 'active');

CALL GenerateCustomerCode(@code2);
INSERT IGNORE INTO clients (customer_code, contact_person, phone, company_name, address, credit_limit, status) VALUES
(@code2, 'Ana Torres', '+506-7777-8888', 'Torres Import', 
'{"street": "Calle 5 Avenida 10", "city": "Cartago", "state": "Cartago", "zipCode": "30101", "country": "Costa Rica"}', 
3000.00, 'active');

COMMIT;