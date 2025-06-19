const express = require('express');
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array()
    });
  }
  next();
};

// Validaciones para registro
const registerValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('El nombre de la empresa no puede exceder 100 caracteres'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('El teléfono no puede exceder 20 caracteres')
];

// Validaciones para login
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido'),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
];

// ============ RUTAS PÚBLICAS ============

// POST /api/auth/register
router.post('/register', 
  registerValidation,
  handleValidationErrors,
  authController.register
);

// POST /api/auth/login
router.post('/login', 
  loginValidation,
  handleValidationErrors,
  authController.login
);

// POST /api/auth/refresh-token
router.post('/refresh-token',
  authController.refreshToken
);

// ============ RUTAS PROTEGIDAS ============

// GET /api/auth/me - Obtener usuario actual
router.get('/me', 
  authenticateToken,
  authController.getCurrentUser
);

// POST /api/auth/logout
router.post('/logout',
  authenticateToken,
  authController.logout
);

module.exports = router;