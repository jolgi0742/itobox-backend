// scripts/setup-database.js - SCRIPT DE CONFIGURACIÓN AUTOMÁTICA
require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
    log(`\n📋 PASO ${step}: ${message}`, 'bright');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

class DatabaseSetup {
    constructor() {
        this.config = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'itobox_courier'
        };
    }

    async checkEnvironment() {
        logStep(1, 'Verificando configuración del entorno');
        
        // Verificar variables de entorno críticas
        const requiredVars = ['DB_HOST', 'DB_USER', 'DB_NAME'];
        const missingVars = [];
        
        for (const varName of requiredVars) {
            if (!process.env[varName]) {
                missingVars.push(varName);
            }
        }
        
        if (missingVars.length > 0) {
            logError(`Variables de entorno faltantes: ${missingVars.join(', ')}`);
            logInfo('Crea un archivo .env basado en .env.example');
            process.exit(1);
        }
        
        // Verificar que existe .env
        try {
            await fs.access('.env');
            logSuccess('Archivo .env encontrado');
        } catch {
            logWarning('Archivo .env no encontrado, usando variables del sistema');
        }
        
        logSuccess('Configuración del entorno verificada');
    }

    async testConnection() {
        logStep(2, 'Probando conexión a MySQL');
        
        try {
            // Conectar sin especificar base de datos primero
            const connection = await mysql.createConnection({
                host: this.config.host,
                port: this.config.port,
                user: this.config.user,
                password: this.config.password
            });
            
            logSuccess(`Conectado a MySQL en ${this.config.host}:${this.config.port}`);
            
            // Verificar versión de MySQL
            const [rows] = await connection.execute('SELECT VERSION() as version');
            const version = rows[0].version;
            logInfo(`Versión de MySQL: ${version}`);
            
            // Verificar permisos
            const [grants] = await connection.execute('SHOW GRANTS');
            logInfo(`Permisos verificados: ${grants.length} grants encontrados`);
            
            await connection.end();
            return true;
        } catch (error) {
            logError(`Error conectando a MySQL: ${error.message}`);
            logInfo('Verifica que MySQL esté corriendo y las credenciales sean correctas');
            return false;
        }
    }

    async createDatabase() {
        logStep(3, 'Creando base de datos');
        
        try {
            const connection = await mysql.createConnection({
                host: this.config.host,
                port: this.config.port,
                user: this.config.user,
                password: this.config.password
            });
            
            // Crear base de datos si no existe
            await connection.execute(`
                CREATE DATABASE IF NOT EXISTS \`${this.config.database}\` 
                CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
            `);
            
            logSuccess(`Base de datos '${this.config.database}' creada/verificada`);
            
            // Verificar que se puede usar
            await connection.execute(`USE \`${this.config.database}\``);
            logSuccess('Base de datos seleccionada correctamente');
            
            await connection.end();
            return true;
        } catch (error) {
            logError(`Error creando base de datos: ${error.message}`);
            return false;
        }
    }

    async runSchema() {
        logStep(4, 'Ejecutando schema de base de datos');
        
        try {
            const connection = await mysql.createConnection(this.config);
            
            // Leer archivo de schema
            const schemaPath = path.join(__dirname, '..', 'database-schema-camca.sql');
            let schemaSQL;
            
            try {
                schemaSQL = await fs.readFile(schemaPath, 'utf8');
                logSuccess('Archivo de schema leído correctamente');
            } catch {
                logWarning('Archivo database-schema-camca.sql no encontrado');
                logInfo('Creando schema básico...');
                schemaSQL = this.getBasicSchema();
            }
            
            // Ejecutar schema por bloques
            const statements = schemaSQL
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
            
            let tablesCreated = 0;
            let triggersCreated = 0;
            let indexesCreated = 0;
            
            for (const statement of statements) {
                if (statement.toUpperCase().includes('CREATE TABLE')) {
                    try {
                        await connection.execute(statement);
                        tablesCreated++;
                        
                        // Extraer nombre de tabla
                        const match = statement.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?`?(\w+)`?/i);
                        if (match) {
                            logSuccess(`Tabla '${match[1]}' creada`);
                        }
                    } catch (error) {
                        if (!error.message.includes('already exists')) {
                            logWarning(`Error creando tabla: ${error.message}`);
                        }
                    }
                } else if (statement.toUpperCase().includes('CREATE TRIGGER')) {
                    try {
                        await connection.execute(statement);
                        triggersCreated++;
                        logSuccess('Trigger creado');
                    } catch (error) {
                        if (!error.message.includes('already exists')) {
                            logWarning(`Error creando trigger: ${error.message}`);
                        }
                    }
                } else if (statement.toUpperCase().includes('CREATE INDEX')) {
                    try {
                        await connection.execute(statement);
                        indexesCreated++;
                        logSuccess('Índice creado');
                    } catch (error) {
                        if (!error.message.includes('already exists')) {
                            logWarning(`Error creando índice: ${error.message}`);
                        }
                    }
                } else if (statement.toUpperCase().includes('INSERT')) {
                    try {
                        await connection.execute(statement);
                    } catch (error) {
                        // Ignorar errores de inserción (duplicados)
                    }
                }
            }
            
            logSuccess(`Schema ejecutado: ${tablesCreated} tablas, ${triggersCreated} triggers, ${indexesCreated} índices`);
            
            await connection.end();
            return true;
        } catch (error) {
            logError(`Error ejecutando schema: ${error.message}`);
            return false;
        }
    }

    async verifyTables() {
        logStep(5, 'Verificando tablas creadas');
        
        try {
            const connection = await mysql.createConnection(this.config);
            
            const expectedTables = [
                'users',
                'clients', 
                'packages',
                'tracking_events',
                'warehouse_receipts',
                'manifests',
                'manifest_whr_items'
            ];
            
            const [tables] = await connection.execute(`
                SELECT TABLE_NAME 
                FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = ?
            `, [this.config.database]);
            
            const existingTables = tables.map(row => row.TABLE_NAME);
            
            logInfo(`Tablas encontradas: ${existingTables.length}`);
            
            for (const tableName of expectedTables) {
                if (existingTables.includes(tableName)) {
                    logSuccess(`✓ ${tableName}`);
                } else {
                    logWarning(`✗ ${tableName} (faltante)`);
                }
            }
            
            // Verificar tabla warehouse_receipts específicamente
            if (existingTables.includes('warehouse_receipts')) {
                const [columns] = await connection.execute(`
                    SELECT COLUMN_NAME 
                    FROM information_schema.COLUMNS 
                    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'warehouse_receipts'
                `, [this.config.database]);
                
                logInfo(`Columnas en warehouse_receipts: ${columns.length}`);
                
                // Verificar columnas clave de CAMCA
                const keyColumns = ['whr_number', 'volume_ft3', 'volume_weight_vlb', 'classification'];
                for (const col of keyColumns) {
                    const hasColumn = columns.some(row => row.COLUMN_NAME === col);
                    if (hasColumn) {
                        logSuccess(`✓ Columna CAMCA: ${col}`);
                    } else {
                        logWarning(`✗ Columna CAMCA faltante: ${col}`);
                    }
                }
            }
            
            await connection.end();
            return true;
        } catch (error) {
            logError(`Error verificando tablas: ${error.message}`);
            return false;
        }
    }

    async insertTestData() {
        logStep(6, 'Insertando datos de prueba');
        
        try {
            const connection = await mysql.createConnection(this.config);
            
            // Usuario admin por defecto
            try {
                await connection.execute(`
                    INSERT IGNORE INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    'admin@itobox.com',
                    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj7tJ5s.qODe', // password: admin123
                    'Admin',
                    'Sistema',
                    'admin',
                    true,
                    true
                ]);
                logSuccess('Usuario admin creado (email: admin@itobox.com, password: admin123)');
            } catch (error) {
                logWarning('Usuario admin ya existe');
            }
            
            // Usuario operador CAMCA
            try {
                await connection.execute(`
                    INSERT IGNORE INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    'operator@itobox.com',
                    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj7tJ5s.qODe', // password: admin123
                    'Operador',
                    'CAMCA',
                    'operator',
                    true,
                    true
                ]);
                logSuccess('Usuario operador creado (email: operator@itobox.com, password: admin123)');
            } catch (error) {
                logWarning('Usuario operador ya existe');
            }
            
            // WHR de ejemplo si no existe
            const [existingWHR] = await connection.execute(
                'SELECT COUNT(*) as count FROM warehouse_receipts'
            );
            
            if (existingWHR[0].count === 0) {
                try {
                    await connection.execute(`
                        INSERT INTO warehouse_receipts (
                            tracking_number, received_by, 
                            shipper_name, shipper_company, shipper_address, shipper_phone,
                            consignee_name, consignee_company, consignee_address, consignee_phone, consignee_email,
                            carrier, content, pieces, weight_lb, length_in, width_in, height_in,
                            invoice_number, declared_value, po_number, departure_date, transport_type, notes
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
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
                        '2024-12-20',
                        'air',
                        'Paquete de prueba CAMCA'
                    ]);
                    
                    logSuccess('WHR de ejemplo creado');
                } catch (error) {
                    logWarning(`Error creando WHR de ejemplo: ${error.message}`);
                }
            } else {
                logInfo(`${existingWHR[0].count} WHRs ya existen en el sistema`);
            }
            
            await connection.end();
            return true;
        } catch (error) {
            logError(`Error insertando datos de prueba: ${error.message}`);
            return false;
        }
    }

    async createDirectories() {
        logStep(7, 'Creando directorios necesarios');
        
        const directories = [
            'uploads',
            'logs', 
            'backups',
            'exports',
            'templates'
        ];
        
        for (const dir of directories) {
            try {
                await fs.mkdir(dir, { recursive: true });
                logSuccess(`Directorio '${dir}' creado`);
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    logWarning(`Error creando directorio '${dir}': ${error.message}`);
                }
            }
        }
        
        // Crear archivo .gitkeep en directorios
        for (const dir of directories) {
            try {
                await fs.writeFile(path.join(dir, '.gitkeep'), '');
            } catch (error) {
                // Ignorar errores
            }
        }
        
        return true;
    }

    async finalVerification() {
        logStep(8, 'Verificación final del sistema');
        
        try {
            const connection = await mysql.createConnection(this.config);
            
            // Verificar función WHR
            const [whrTest] = await connection.execute(`
                SELECT get_next_whr_number() as next_whr
            `);
            
            if (whrTest[0] && whrTest[0].next_whr) {
                logSuccess(`Sistema WHR funcionando. Próximo número: ${whrTest[0].next_whr}`);
            } else {
                logWarning('Sistema WHR no completamente funcional');
            }
            
            // Verificar triggers
            const [triggers] = await connection.execute(`
                SELECT TRIGGER_NAME 
                FROM information_schema.TRIGGERS 
                WHERE TRIGGER_SCHEMA = ?
            `, [this.config.database]);
            
            logInfo(`Triggers activos: ${triggers.length}`);
            
            await connection.end();
            return true;
        } catch (error) {
            logWarning(`Verificación final con errores: ${error.message}`);
            return true; // No es crítico
        }
    }

    getBasicSchema() {
        return `
            CREATE TABLE IF NOT EXISTS warehouse_receipts (
                id INT PRIMARY KEY AUTO_INCREMENT,
                whr_number VARCHAR(50) UNIQUE NOT NULL,
                tracking_number VARCHAR(100) NOT NULL,
                consignee_email VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
    }

    async run() {
        log('\n🚀 INICIANDO CONFIGURACIÓN DE ITOBOX COURIER + CAMCA', 'bright');
        log('====================================================\n', 'bright');
        
        const steps = [
            () => this.checkEnvironment(),
            () => this.testConnection(),
            () => this.createDatabase(),
            () => this.runSchema(),
            () => this.verifyTables(),
            () => this.insertTestData(),
            () => this.createDirectories(),
            () => this.finalVerification()
        ];
        
        for (let i = 0; i < steps.length; i++) {
            const success = await steps[i]();
            if (!success) {
                logError(`\nConfiguración falló en el paso ${i + 1}`);
                process.exit(1);
            }
        }
        
        log('\n🎉 CONFIGURACIÓN COMPLETADA EXITOSAMENTE', 'green');
        log('=======================================\n', 'green');
        
        logInfo('Próximos pasos:');
        log('1. npm run dev    - Iniciar servidor en desarrollo', 'cyan');
        log('2. npm test       - Ejecutar tests', 'cyan'); 
        log('3. npm start      - Iniciar en producción', 'cyan');
        
        log('\nCredenciales de prueba:', 'yellow');
        log('Email: admin@itobox.com', 'yellow');
        log('Password: admin123\n', 'yellow');
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    const setup = new DatabaseSetup();
    setup.run().catch(error => {
        logError(`Error fatal: ${error.message}`);
        process.exit(1);
    });
}

module.exports = DatabaseSetup;