// itobox-backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Si no hay JWT_SECRET en las variables de entorno, usar mock
    if (!process.env.JWT_SECRET) {
      console.log('⚠️  JWT_SECRET no configurado, usando autenticación mock');
      
      // Mock user para desarrollo
      req.user = {
        id: 'user_123',
        email: 'demo@itobox.com',
        name: 'Usuario Demo',
        role: 'client',
        mailboxId: 'ITB1247'
      };
      
      return next();
    }

    // Verificar token real
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Error de autenticación'
    });
  }
};

module.exports = { authMiddleware };