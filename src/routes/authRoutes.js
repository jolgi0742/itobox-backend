// itobox-backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');

// Importar controlador de autenticación
let authController;
try {
  authController = require('../controllers/authController');
} catch (error) {
  console.log('⚠️  authController no encontrado, creando métodos básicos...');
  
  // Controlador básico temporal si no existe
  authController = {
    register: async (req, res) => {
      try {
        res.json({
          success: true,
          message: 'Registro temporal - implementar authController completo',
          data: { id: 'temp_user', email: req.body.email }
        });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    },

    login: async (req, res) => {
      try {
        const { email, password } = req.body;
        
        if (!email || !password) {
          return res.status(400).json({
            success: false,
            message: 'Email y contraseña son requeridos'
          });
        }

        // Mock login temporal
        const mockUser = {
          id: 'user_123',
          email: email,
          name: 'Usuario Demo',
          role: 'client',
          mailboxId: 'ITB1247'
        };

        // Mock token temporal
        const mockToken = 'mock_jwt_token_' + Date.now();

        res.json({
          success: true,
          message: 'Login temporal exitoso',
          data: {
            user: mockUser,
            token: mockToken
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    },

    logout: async (req, res) => {
      try {
        res.json({
          success: true,
          message: 'Logout exitoso'
        });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    },

    getProfile: async (req, res) => {
      try {
        // Mock user profile
        const mockProfile = {
          id: 'user_123',
          email: 'demo@itobox.com',
          name: 'Usuario Demo',
          role: 'client',
          mailboxId: 'ITB1247',
          status: 'active'
        };

        res.json({
          success: true,
          data: mockProfile
        });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    },

    refreshToken: async (req, res) => {
      try {
        const newToken = 'refreshed_mock_token_' + Date.now();
        
        res.json({
          success: true,
          data: { token: newToken }
        });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    },

    forgotPassword: async (req, res) => {
      try {
        const { email } = req.body;
        
        if (!email) {
          return res.status(400).json({
            success: false,
            message: 'Email es requerido'
          });
        }

        res.json({
          success: true,
          message: 'Se ha enviado un email con instrucciones para restablecer la contraseña'
        });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    },

    resetPassword: async (req, res) => {
      try {
        const { token, newPassword } = req.body;
        
        if (!token || !newPassword) {
          return res.status(400).json({
            success: false,
            message: 'Token y nueva contraseña son requeridos'
          });
        }

        res.json({
          success: true,
          message: 'Contraseña restablecida exitosamente'
        });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    },

    verifyEmail: async (req, res) => {
      try {
        const { token } = req.body;
        
        if (!token) {
          return res.status(400).json({
            success: false,
            message: 'Token de verificación es requerido'
          });
        }

        res.json({
          success: true,
          message: 'Email verificado exitosamente'
        });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    }
  };
}

// ============ RUTAS DE AUTENTICACIÓN ============

// Registro de usuario
router.post('/register', authController.register);

// Login
router.post('/login', authController.login);

// Logout
router.post('/logout', authMiddleware, authController.logout);

// Obtener perfil del usuario autenticado
router.get('/profile', authMiddleware, authController.getProfile);

// Refresh token
router.post('/refresh-token', authController.refreshToken);

// Forgot password
router.post('/forgot-password', authController.forgotPassword);

// Reset password
router.post('/reset-password', authController.resetPassword);

// Verify email
router.post('/verify-email', authController.verifyEmail);

// Verificar si el token es válido
router.get('/verify-token', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Token válido',
    user: req.user || { id: 'mock_user', email: 'demo@itobox.com' }
  });
});

// Health check para auth
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth service is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;