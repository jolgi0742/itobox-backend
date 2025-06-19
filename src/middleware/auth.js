// Middleware de autenticación para ITOBOX Courier
// Versión de desarrollo con tokens simulados

// Datos de usuarios simulados para desarrollo
const simulatedUsers = {
  'admin@itobox.com': {
    id: 1,
    email: 'admin@itobox.com',
    firstName: 'Admin',
    lastName: 'ITOBOX',
    role: 'admin',
    company: 'ITOBOX Courier',
    phone: '+1234567890',
    isActive: true,
    preferences: {
      language: 'es',
      theme: 'light',
      notifications: true
    }
  },
  'user@itobox.com': {
    id: 2,
    email: 'user@itobox.com',
    firstName: 'Usuario',
    lastName: 'Prueba',
    role: 'user',
    company: 'Empresa Demo',
    phone: '+0987654321',
    isActive: true,
    preferences: {
      language: 'es',
      theme: 'light',
      notifications: true
    }
  }
};

// Middleware principal para verificar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    console.log('🔐 Middleware auth ejecutándose...');
    console.log('🌐 URL:', req.method, req.originalUrl);
    console.log('📋 Headers:', Object.keys(req.headers));
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('🎫 Auth header:', authHeader ? 'presente' : 'ausente');
    console.log('🎫 Token extraído:', token ? token.substring(0, 20) + '...' : 'ninguno');

    if (!token) {
      console.log('❌ No hay token en la petición');
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    // Para desarrollo, aceptar el token fake específico
    if (token === 'fake-jwt-token-for-testing') {
      console.log('✅ Token fake válido para desarrollo');
      
      // Determinar usuario basado en el contexto o usar admin por defecto
      const defaultUser = simulatedUsers['admin@itobox.com'];
      
      // Agregar información del usuario al request
      req.userId = defaultUser.id;
      req.userEmail = defaultUser.email;
      req.userRole = defaultUser.role;
      req.user = defaultUser;
      
      console.log('👤 Usuario autenticado:', req.user.email, '| Rol:', req.user.role);
      return next();
    }

    // Si no es el token esperado, rechazar
    console.log('❌ Token no válido:', token);
    console.log('   Expected: fake-jwt-token-for-testing');
    console.log('   Received:', token);
    
    return res.status(403).json({
      success: false,
      message: 'Token inválido'
    });

  } catch (error) {
    console.error('💥 Error en middleware auth:', error);
    return res.status(403).json({
      success: false,
      message: 'Error de autenticación',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Middleware para verificar roles específicos
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    console.log('🛡️ Verificando autorización de roles...');
    console.log('🎭 Roles requeridos:', roles);
    console.log('👤 Usuario rol actual:', req.userRole);
    console.log('📧 Usuario email:', req.userEmail);
    
    if (!req.userRole) {
      console.log('❌ No hay rol de usuario en el request');
      return res.status(403).json({
        success: false,
        message: 'No se pudo determinar el rol del usuario'
      });
    }

    if (!roles.includes(req.userRole)) {
      console.log('❌ Rol no autorizado');
      console.log(`   Usuario con rol '${req.userRole}' intentó acceder a recurso que requiere: ${roles.join(', ')}`);
      
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso'
      });
    }
    
    console.log('✅ Rol autorizado - permitiendo acceso');
    next();
  };
};

// Middleware opcional de autenticación (no requiere token obligatorio)
const optionalAuth = async (req, res, next) => {
  try {
    console.log('🔓 Middleware auth opcional ejecutándose...');
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token === 'fake-jwt-token-for-testing') {
      console.log('✅ Token opcional válido, agregando usuario al request');
      
      const defaultUser = simulatedUsers['admin@itobox.com'];
      
      req.userId = defaultUser.id;
      req.userEmail = defaultUser.email;
      req.userRole = defaultUser.role;
      req.user = defaultUser;
      
      console.log('👤 Usuario opcional autenticado:', req.user.email);
    } else {
      console.log('ℹ️ No hay token válido, continuando sin autenticación');
    }
    
    next();
  } catch (error) {
    console.log('⚠️ Error en auth opcional, continuando sin autenticación:', error.message);
    // Si hay error en token opcional, continúa sin autenticación
    next();
  }
};

// Middleware para verificar si el usuario está activo
const requireActiveUser = (req, res, next) => {
  console.log('✅ Verificando si el usuario está activo...');
  
  if (!req.user) {
    console.log('❌ No hay usuario en el request');
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado'
    });
  }

  if (!req.user.isActive) {
    console.log('❌ Usuario inactivo:', req.user.email);
    return res.status(403).json({
      success: false,
      message: 'Cuenta desactivada. Contacta al administrador'
    });
  }

  console.log('✅ Usuario activo, permitiendo acceso');
  next();
};

// Middleware para logging de requests autenticados
const logAuthenticatedRequests = (req, res, next) => {
  if (req.user) {
    console.log(`📝 Request autenticado: ${req.method} ${req.originalUrl} por ${req.user.email} (${req.user.role})`);
  }
  next();
};

// Función helper para verificar permisos específicos
const hasPermission = (userRole, requiredPermission) => {
  const permissions = {
    admin: ['read', 'write', 'delete', 'manage_users', 'view_reports', 'manage_packages', 'manage_clients'],
    user: ['read', 'write', 'manage_packages', 'manage_clients'],
    client: ['read', 'view_own_packages']
  };

  return permissions[userRole]?.includes(requiredPermission) || false;
};

// Middleware para verificar permisos específicos
const requirePermission = (permission) => {
  return (req, res, next) => {
    console.log(`🔑 Verificando permiso '${permission}' para usuario ${req.userEmail}`);
    
    if (!req.userRole) {
      return res.status(403).json({
        success: false,
        message: 'No se pudo determinar el rol del usuario'
      });
    }

    if (!hasPermission(req.userRole, permission)) {
      console.log(`❌ Permiso '${permission}' denegado para rol '${req.userRole}'`);
      return res.status(403).json({
        success: false,
        message: `No tienes permiso para: ${permission}`
      });
    }

    console.log(`✅ Permiso '${permission}' concedido`);
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  optionalAuth,
  requireActiveUser,
  logAuthenticatedRequests,
  requirePermission,
  hasPermission
};