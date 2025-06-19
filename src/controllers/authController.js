// itobox-backend/src/controllers/authController.js
const authController = {
  register: async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      // Validaciones básicas
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos'
        });
      }

      // Mock registration
      const mockUser = {
        id: 'user_' + Date.now(),
        email,
        firstName,
        lastName,
        role: 'client',
        createdAt: new Date().toISOString()
      };

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente (mock)',
        data: {
          user: mockUser,
          token: 'mock_token_' + Date.now()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error en el registro'
      });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Credenciales de prueba
      const validCredentials = {
        'admin@itobox.com': { password: 'admin123', role: 'admin', name: 'Administrador' },
        'cliente@itobox.com': { password: 'cliente123', role: 'client', name: 'Cliente Demo' },
        'courier@itobox.com': { password: 'courier123', role: 'courier', name: 'Courier Demo' }
      };

      const userCredentials = validCredentials[email];
      
      if (!userCredentials || userCredentials.password !== password) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      const mockUser = {
        id: 'user_' + Date.now(),
        email,
        firstName: userCredentials.name.split(' ')[0],
        lastName: userCredentials.name.split(' ')[1] || '',
        role: userCredentials.role
      };

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          user: mockUser,
          token: 'mock_token_' + Date.now()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error en el login'
      });
    }
  },

  getProfile: async (req, res) => {
    try {
      // Mock user profile from request
      const mockProfile = req.user || {
        id: 'user_123',
        email: 'demo@itobox.com',
        firstName: 'Usuario',
        lastName: 'Demo',
        role: 'client'
      };

      res.json({
        success: true,
        data: { user: mockProfile }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo perfil'
      });
    }
  },

  logout: async (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Logout exitoso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error en el logout'
      });
    }
  }
};

module.exports = authController;