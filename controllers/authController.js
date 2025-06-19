const authController = {
  // Registro de usuario
  register: async (req, res) => {
    try {
      res.status(201).json({
        success: true,
        message: 'Endpoint de registro funcionando',
        data: req.body
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error en registro',
        error: error.message
      });
    }
  },

  // Login de usuario - VERSIÓN SIMPLE PARA TESTING
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      console.log('🔐 Login attempt received:');
      console.log('📧 Email:', email);
      console.log('🔑 Password length:', password ? password.length : 0);
      console.log('📦 Full body:', req.body);
      
      // Login básico para pruebas
      if (email === 'admin@itobox.com' && password === 'admin123') {
        console.log('✅ Credenciales correctas, enviando respuesta exitosa');
        
        const response = {
          success: true,
          message: 'Login exitoso',
          user: {
            id: 1,
            email: 'admin@itobox.com',
            firstName: 'Admin',
            lastName: 'ITOBOX',
            role: 'admin',
            company: 'ITOBOX Courier',
            phone: '+1234567890'
          },
          token: 'fake-jwt-token-for-testing-12345'
        };
        
        console.log('📤 Enviando respuesta:', response);
        res.json(response);
      } else {
        console.log('❌ Credenciales inválidas recibidas:');
        console.log('   Expected: admin@itobox.com / admin123');
        console.log('   Received:', email, '/', password ? '***' : 'empty');
        
        res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }
    } catch (error) {
      console.error('💥 Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error en login',
        error: error.message
      });
    }
  },

  // Obtener usuario actual
  getCurrentUser: async (req, res) => {
    try {
      res.json({
        success: true,
        user: {
          id: 1,
          email: 'admin@itobox.com',
          firstName: 'Admin',
          lastName: 'ITOBOX',
          role: 'admin',
          company: 'ITOBOX Courier'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo usuario'
      });
    }
  },

  // Logout
  logout: async (req, res) => {
    try {
      console.log('🚪 Logout request received');
      res.json({
        success: true,
        message: 'Logout exitoso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error en logout'
      });
    }
  },

  // Refresh token
  refreshToken: async (req, res) => {
    try {
      res.json({
        success: true,
        token: 'new-fake-token-12345'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error en refresh token'
      });
    }
  }
};

module.exports = authController;