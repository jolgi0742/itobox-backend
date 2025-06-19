// itobox-backend/src/controllers/packageController.js
const packageController = {
  getPackages: async (req, res) => {
    try {
      // Mock packages data
      const mockPackages = [
        {
          id: 1,
          trackingNumber: 'ITB1247001',
          senderName: 'Amazon',
          recipientName: 'Juan Pérez',
          status: 'in_transit',
          serviceType: 'express',
          weight: 2.5,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          trackingNumber: 'ITB1247002',
          senderName: 'eBay Store',
          recipientName: 'María García',
          status: 'delivered',
          serviceType: 'standard',
          weight: 1.2,
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ];

      res.json({
        success: true,
        data: mockPackages
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo paquetes'
      });
    }
  },

  getPackage: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Mock package data
      const mockPackage = {
        id: parseInt(id),
        trackingNumber: `ITB1247${id.padStart(3, '0')}`,
        senderName: 'Amazon',
        recipientName: 'Juan Pérez',
        status: 'in_transit',
        serviceType: 'express',
        weight: 2.5,
        createdAt: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 172800000).toISOString()
      };

      res.json({
        success: true,
        data: mockPackage
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo paquete'
      });
    }
  },

  createPackage: async (req, res) => {
    try {
      const packageData = req.body;
      
      // Mock package creation
      const mockPackage = {
        id: Date.now(),
        trackingNumber: 'ITB' + Date.now().toString().slice(-7),
        ...packageData,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      res.status(201).json({
        success: true,
        message: 'Paquete creado exitosamente',
        data: mockPackage
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creando paquete'
      });
    }
  },

  updatePackage: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Mock package update
      const mockPackage = {
        id: parseInt(id),
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      res.json({
        success: true,
        message: 'Paquete actualizado exitosamente',
        data: mockPackage
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error actualizando paquete'
      });
    }
  },

  deletePackage: async (req, res) => {
    try {
      const { id } = req.params;

      res.json({
        success: true,
        message: `Paquete ${id} eliminado exitosamente`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando paquete'
      });
    }
  }
};

module.exports = packageController;