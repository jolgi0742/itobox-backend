// itobox-backend/src/controllers/dashboardController.js
const dashboardController = {
  getDashboardStats: async (req, res) => {
    try {
      // Mock dashboard statistics
      const mockStats = {
        totalPackages: 156,
        pendingPackages: 23,
        inTransitPackages: 45,
        deliveredPackages: 88,
        totalValue: 15420.50,
        avgDeliveryTime: 3.2,
        monthlyGrowth: 12.5,
        customerSatisfaction: 98.2
      };

      res.json({
        success: true,
        data: mockStats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas'
      });
    }
  },

  getRecentActivity: async (req, res) => {
    try {
      // Mock recent activity
      const mockActivity = [
        {
          id: 1,
          type: 'package_created',
          description: 'Nuevo paquete ITB1247001 creado',
          timestamp: new Date().toISOString(),
          user: 'Sistema'
        },
        {
          id: 2,
          type: 'status_update',
          description: 'Paquete ITB1247002 marcado como entregado',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          user: 'Courier Demo'
        }
      ];

      res.json({
        success: true,
        data: mockActivity
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo actividad reciente'
      });
    }
  },

  getChartData: async (req, res) => {
    try {
      const { type } = req.params;
      
      let mockData = {};
      
      switch (type) {
        case 'revenue':
          mockData = {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
            data: [12000, 15000, 18000, 16000, 20000, 22000]
          };
          break;
        case 'packages':
          mockData = {
            labels: ['Pendientes', 'En tránsito', 'Entregados'],
            data: [23, 45, 88]
          };
          break;
        default:
          mockData = { labels: [], data: [] };
      }

      res.json({
        success: true,
        data: mockData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo datos del gráfico'
      });
    }
  },

  getAdminDashboard: async (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Dashboard de administrador',
        data: { role: 'admin', dashboard: 'admin_specific_data' }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error en dashboard de admin'
      });
    }
  },

  getAgentDashboard: async (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Dashboard de agente',
        data: { role: 'agent', dashboard: 'agent_specific_data' }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error en dashboard de agente'
      });
    }
  },

  getClientDashboard: async (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Dashboard de cliente',
        data: { role: 'client', dashboard: 'client_specific_data' }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error en dashboard de cliente'
      });
    }
  }
};

module.exports = dashboardController;