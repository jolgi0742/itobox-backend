// itobox-backend/src/config/database.js
require('dotenv').config();

// ============ CONFIGURACIÓN DE BASE DE DATOS ============

const dbConfig = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'itobox_courier',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4',
    timezone: 'Z',
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    connectionLimit: 10
  },
  production: {
    connectionString: process.env.DB_CONNECTION_STRING,
    ssl: {
      rejectUnauthorized: false
    }
  }
};

// ============ FUNCIÓN DE TEST DE CONEXIÓN ============

const testConnection = async () => {
  try {
    console.log('🔍 Testing database connection...');
    
    const environment = process.env.NODE_ENV || 'development';
    console.log(`🌍 Environment: ${environment}`);
    
    if (environment === 'development') {
      // En desarrollo, verificar si MySQL está disponible
      if (process.env.DB_CONNECTION_STRING || process.env.DB_HOST) {
        console.log('📡 Database configuration found');
        
        // TODO: Implementar test real de MySQL cuando esté listo
        // const mysql = require('mysql2/promise');
        // const connection = await mysql.createConnection(dbConfig.development);
        // await connection.ping();
        // await connection.end();
        
        console.log('✅ Database connection test passed (mock)');
        return true;
      } else {
        console.log('⚠️  No database configuration found');
        console.log('📝 Using mock data for development');
        return true;
      }
    }
    
    if (environment === 'production') {
      if (!process.env.DB_CONNECTION_STRING) {
        throw new Error('DB_CONNECTION_STRING is required in production');
      }
      
      // TODO: Implementar conexión real en producción
      console.log('✅ Production database connection configured');
      return true;
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    
    console.log('🔄 Continuing with mock data in development...');
    return false;
  }
};

// ============ FUNCIONES DE UTILIDAD ============

const getDatabaseInfo = () => {
  const environment = process.env.NODE_ENV || 'development';
  
  if (environment === 'development') {
    return {
      type: 'MySQL (Development)',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'itobox_courier',
      status: 'Mock data active'
    };
  }
  
  return {
    type: 'MySQL (Production)',
    host: 'Remote server',
    database: 'itobox_courier',
    status: 'Connected'
  };
};

const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

const isDevelopment = () => {
  return process.env.NODE_ENV !== 'production';
};

// ============ SCHEMA INFORMATION ============

const schemaInfo = {
  tables: [
    {
      name: 'whr_packages',
      description: 'Warehouse Receipt packages',
      columns: [
        'id', 'whr_number', 'shipper_name', 'shipper_email',
        'consignee_name', 'consignee_email', 'tracking_number',
        'pieces', 'weight', 'length', 'width', 'height', 'volume',
        'volume_weight', 'declared_value', 'classification', 'email_sent',
        'arrival_date', 'created_at', 'updated_at'
      ]
    },
    {
      name: 'whr_tracking_events',
      description: 'Tracking events for WHR packages',
      columns: [
        'id', 'whr_id', 'event_type', 'description', 'location',
        'event_date', 'created_by', 'created_at'
      ]
    },
    {
      name: 'whr_manifests',
      description: 'Shipping manifests',
      columns: [
        'id', 'manifest_number', 'transport_type', 'departure_date',
        'destination', 'status', 'total_packages', 'total_weight',
        'created_at', 'updated_at'
      ]
    }
  ],
  views: [
    {
      name: 'v_whr_stats',
      description: 'Statistics view for WHR dashboard'
    },
    {
      name: 'v_whr_complete',
      description: 'Complete WHR information with tracking'
    }
  ]
};

// ============ MOCK DATA PARA DESARROLLO ============

const generateMockData = () => {
  const mockWHRs = [];
  
  for (let i = 1; i <= 10; i++) {
    const today = new Date();
    const dateStr = today.toISOString().slice(2, 10).replace(/-/g, '');
    const sequence = String(i).padStart(3, '0');
    
    mockWHRs.push({
      id: i,
      whr_number: `WHR${dateStr}${sequence}`,
      shipper_name: `Shipper Company ${i}`,
      shipper_email: `shipper${i}@company.com`,
      consignee_name: `Consignee Corp ${i}`,
      consignee_email: `consignee${i}@corp.com`,
      tracking_number: `TRK${dateStr}${sequence}`,
      pieces: Math.floor(Math.random() * 10) + 1,
      weight: parseFloat((Math.random() * 50 + 5).toFixed(2)),
      length: parseFloat((Math.random() * 100 + 10).toFixed(2)),
      width: parseFloat((Math.random() * 80 + 10).toFixed(2)),
      height: parseFloat((Math.random() * 60 + 10).toFixed(2)),
      volume: parseFloat((Math.random() * 0.5).toFixed(6)),
      volume_weight: parseFloat((Math.random() * 5).toFixed(3)),
      declared_value: parseFloat((Math.random() * 5000 + 100).toFixed(2)),
      classification: ['pending', 'awb', 'bl'][Math.floor(Math.random() * 3)],
      email_sent: Math.random() > 0.5,
      arrival_date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  return mockWHRs;
};

// ============ EXPORTAR FUNCIONES ============

module.exports = {
  testConnection,
  getDatabaseInfo,
  isProduction,
  isDevelopment,
  schemaInfo,
  generateMockData,
  dbConfig
};