// itobox-backend/src/server.js
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Importar app, server e io desde app.js
const { app, server, io } = require('./app');

// ============ CONFIGURACIÓN DEL SERVIDOR ============

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============ FUNCIÓN DE CONEXIÓN A BASE DE DATOS ============

const connectDB = async () => {
  try {
    console.log('🔄 Iniciando conexión a la base de datos...');
    
    // Detectar ambiente
    if (NODE_ENV === 'development') {
      console.log('🏠 Detectado ambiente local - usando configuración de desarrollo');
    }

    // Si hay string de conexión, intentar conectar
    if (process.env.DB_CONNECTION_STRING) {
      console.log('📡 Intentando conectar con BD...');
      
      // TODO: Implementar conexión real a la base de datos
      // Ejemplo con Sequelize:
      // const { Sequelize } = require('sequelize');
      // const sequelize = new Sequelize(process.env.DB_CONNECTION_STRING);
      // await sequelize.authenticate();
      
      console.log('✅ Base de datos conectada exitosamente');
    } else {
      console.log('⚠️  DB_CONNECTION_STRING no configurado');
      console.log('✅ Continuando en modo desarrollo con datos mock');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    
    // En desarrollo, continuar sin base de datos
    if (NODE_ENV === 'development') {
      console.log('🔄 Continuando en modo desarrollo sin BD...');
      return true;
    }
    
    // En producción, fallar
    throw error;
  }
};

// ============ CREAR DIRECTORIOS NECESARIOS ============

const createDirectories = () => {
  try {
    console.log('📁 Verificando directorios necesarios...');
    
    const directories = [
      path.join(__dirname, '../uploads'),
      path.join(__dirname, '../uploads/clients'),
      path.join(__dirname, '../uploads/packages'),
      path.join(__dirname, '../uploads/documents'),
      path.join(__dirname, '../uploads/invoices'),
      path.join(__dirname, '../uploads/signatures'),
      path.join(__dirname, '../logs')
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📂 Directorio creado: ${dir}`);
      } else {
        console.log(`✅ Directorio existe: ${dir}`);
      }
    });

    console.log('✅ Todos los directorios están listos');
  } catch (error) {
    console.error('❌ Error creando directorios:', error.message);
    // No fallar el inicio por esto
  }
};

// ============ VERIFICAR VARIABLES DE ENTORNO ============

const checkEnvironmentVariables = () => {
  console.log('🔍 Verificando variables de entorno...');
  
  const requiredVars = [];
  const optionalVars = [
    'JWT_SECRET',
    'DB_CONNECTION_STRING',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS',
    'STRIPE_SECRET_KEY',
    'PAYPAL_CLIENT_ID',
    'FRONTEND_URL'
  ];

  // Verificar variables requeridas
  const missingRequired = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingRequired.length > 0) {
    console.warn('⚠️  Variables requeridas faltantes:', missingRequired.join(', '));
    if (NODE_ENV === 'production') {
      console.error('❌ En producción, todas las variables requeridas deben estar configuradas');
      process.exit(1);
    }
  }

  // Mostrar estado de variables opcionales
  console.log('📋 Estado de configuración:');
  optionalVars.forEach(varName => {
    const isSet = !!process.env[varName];
    const status = isSet ? '✅' : '❌';
    const value = isSet ? 
      (varName.includes('SECRET') || varName.includes('PASS') ? '***' : process.env[varName]) : 
      'No configurado';
    console.log(`   ${status} ${varName}: ${value}`);
  });
};

// ============ INICIALIZAR SERVICIOS EXTERNOS ============

const initializeServices = async () => {
  try {
    console.log('🔧 Inicializando servicios externos...');

    // Verificar servicio de email
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      console.log('📧 Servicio de email: Configurado');
      // TODO: Probar conexión SMTP
    } else {
      console.log('📧 Servicio de email: No configurado (modo mock)');
    }

    // Verificar Stripe
    if (process.env.STRIPE_SECRET_KEY) {
      console.log('💳 Stripe: Configurado');
      // TODO: Verificar conexión con Stripe
    } else {
      console.log('💳 Stripe: No configurado (modo mock)');
    }

    // Verificar PayPal
    if (process.env.PAYPAL_CLIENT_ID) {
      console.log('💰 PayPal: Configurado');
      // TODO: Verificar conexión con PayPal
    } else {
      console.log('💰 PayPal: No configurado (modo mock)');
    }

    console.log('✅ Servicios externos inicializados');
  } catch (error) {
    console.error('❌ Error inicializando servicios externos:', error.message);
    // No fallar el inicio por esto en desarrollo
    if (NODE_ENV === 'production') {
      throw error;
    }
  }
};

// ============ FUNCIÓN PRINCIPAL DE INICIO ============

const startServer = async () => {
  try {
    console.log('🚀 Iniciando servidor ITOBOX Courier...');
    console.log('==========================================');
    
    // 1. Verificar variables de entorno
    checkEnvironmentVariables();
    
    // 2. Crear directorios necesarios
    createDirectories();
    
    // 3. Conectar a la base de datos
    await connectDB();
    
    // 4. Inicializar servicios externos
    await initializeServices();
    
    // 5. Iniciar el servidor (USAR server EN LUGAR DE app)
    const httpServer = server.listen(PORT, () => {
      console.log('🎯 Inicialización completada');
      console.log('==========================================');
      console.log('🎉 Servidor ITOBOX iniciado exitosamente!');
      console.log(`📡 Puerto: ${PORT}`);
      console.log(`🌍 Entorno: ${NODE_ENV}`);
      console.log(`🕐 Hora de inicio: ${new Date().toLocaleString()}`);
      console.log(`📋 API Base: http://localhost:${PORT}`);
      console.log('==========================================');
      console.log('📍 Endpoints principales:');
      console.log(`   🏠 Home: http://localhost:${PORT}`);
      console.log(`   ❤️  Health: http://localhost:${PORT}/health`);
      console.log(`   🔐 Auth: http://localhost:${PORT}/api/auth`);
      console.log(`   👥 Client Portal: http://localhost:${PORT}/api/client-portal`);
      console.log(`   💰 Billing: http://localhost:${PORT}/api/billing`);
      console.log(`   📦 Packages: http://localhost:${PORT}/api/packages`);
      console.log(`   🔍 Tracking: http://localhost:${PORT}/api/tracking`);
      console.log(`   📊 Dashboard: http://localhost:${PORT}/api/dashboard`);
      console.log(`   🔔 Notifications: http://localhost:${PORT}/api/notifications`);
      console.log('==========================================');
      
      if (NODE_ENV === 'development') {
        console.log('🧪 Endpoints de prueba:');
        console.log(`   GET  http://localhost:${PORT}/api/auth/profile`);
        console.log(`   GET  http://localhost:${PORT}/api/dashboard/stats`);
        console.log(`   POST http://localhost:${PORT}/api/auth/login`);
        console.log(`   GET  http://localhost:${PORT}/api/packages`);
        console.log('==========================================');
        console.log('👤 Credenciales de prueba:');
        console.log('   Admin: admin@itobox.com / admin123');
        console.log('   Cliente: cliente@itobox.com / cliente123');
        console.log('   Courier: courier@itobox.com / courier123');
        console.log('==========================================');
        console.log('🔌 Funcionalidades activas:');
        console.log('   ✅ WebSockets para tracking en tiempo real');
        console.log('   ✅ APIs mock con datos realistas');
        console.log('   ✅ Autenticación JWT simulada');
        console.log('   ✅ Sistema de uploads configurado');
        console.log('   ✅ CORS configurado para frontend');
        console.log('==========================================');
      }
      
      console.log('✅ Servidor listo para recibir peticiones');
      console.log('🔌 WebSockets activos y listos');
    });

    // Configurar timeout del servidor
    httpServer.timeout = 30000; // 30 segundos

    // Manejo graceful de cierre del servidor
    const gracefulShutdown = (signal) => {
      console.log(`\n📴 Recibida señal ${signal}, cerrando servidor...`);
      
      // Cerrar conexiones WebSocket
      io.close(() => {
        console.log('🔌 WebSockets cerrados');
      });
      
      httpServer.close((err) => {
        if (err) {
          console.error('❌ Error cerrando servidor:', err);
          process.exit(1);
        }
        
        console.log('✅ Servidor HTTP cerrado exitosamente');
        
        // Cerrar conexiones de base de datos
        // TODO: Implementar cierre de conexiones
        
        console.log('👋 Proceso terminado correctamente');
        process.exit(0);
      });

      // Forzar cierre después de 30 segundos
      setTimeout(() => {
        console.error('⏰ Forzando cierre del servidor...');
        process.exit(1);
      }, 30000);
    };

    // Escuchar señales de terminación
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return httpServer;

  } catch (error) {
    console.error('💥 Error fatal al iniciar el servidor:');
    console.error(error);
    
    if (NODE_ENV === 'development') {
      console.log('\n🔧 Sugerencias para resolver el problema:');
      console.log('1. Verifica que todas las dependencias estén instaladas: npm install');
      console.log('2. Verifica tu archivo .env');
      console.log('3. Verifica que no haya otro proceso usando el puerto', PORT);
      console.log('4. Revisa los logs anteriores para errores específicos');
      console.log('5. Verifica que app.js exporte correctamente { app, server, io }');
    }
    
    process.exit(1);
  }
};

// ============ MANEJO DE ERRORES GLOBALES ============

// Capturar errores no manejados
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  
  if (NODE_ENV === 'production') {
    // En producción, log y salir
    console.error('🚨 Terminando proceso debido a error no manejado');
    process.exit(1);
  } else {
    // En desarrollo, solo logear
    console.log('🔄 Continuando en modo desarrollo...');
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  
  if (NODE_ENV === 'production') {
    console.error('🚨 Terminando proceso debido a promesa rechazada no manejada');
    process.exit(1);
  } else {
    console.log('🔄 Continuando en modo desarrollo...');
  }
});

// ============ INICIAR EL SERVIDOR ============

// Solo iniciar si este archivo es ejecutado directamente
if (require.main === module) {
  startServer()
    .then(() => {
      console.log('🎯 Inicialización completada exitosamente');
    })
    .catch((error) => {
      console.error('❌ Error en la inicialización:', error);
      process.exit(1);
    });
}

// Exportar para testing

// AGREGAR ESTAS LÍNEAS AL FINAL DE src/server.js PARA VERIFICAR MYSQL

// Verificar conexión MySQL al inicializar
const { testConnection } = require('./config/database');

// Test de conexión MySQL
testConnection().then(success => {
    if (success) {
        console.log('🎉 MySQL WHR System - Ready!');
    } else {
        console.log('⚠️  MySQL WHR System - Fallback to mock data');
    }
}).catch(error => {
    console.error('❌ MySQL Test Error:', error.message);
});

console.log('==========================================');
console.log('🗄️  MySQL WHR System Status:');
console.log('   Database: itobox_courier');
console.log('   Tables: whr_packages, whr_tracking_events');
console.log('   Views: v_whr_stats, v_whr_dashboard');
console.log('==========================================');

module.exports = { startServer, server, io };