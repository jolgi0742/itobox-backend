// itobox-backend/src/middleware/authorize.js
const authorize = (...roles) => {
  return (req, res, next) => {
    // Si no hay usuario en la request (fallo de autenticación)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Acceso no autorizado'
      });
    }

    // Verificar si el rol del usuario está en los roles permitidos
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso'
      });
    }

    next();
  };
};

module.exports = authorize;