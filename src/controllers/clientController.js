// itobox-backend/src/controllers/clientController.js
const clientController = {
  getClients: async (req, res) => {
    try {
      const mockClients = [
        { id: 1, name: 'Juan Pérez', email: 'juan@email.com', status: 'active' },
        { id: 2, name: 'María García', email: 'maria@email.com', status: 'active' }
      ];
      res.json({ success: true, data: mockClients });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error obteniendo clientes' });
    }
  },

  getClient: async (req, res) => {
    try {
      const { id } = req.params;
      const mockClient = {
        id: parseInt(id),
        name: 'Juan Pérez',
        email: 'juan@email.com',
        status: 'active'
      };
      res.json({ success: true, data: mockClient });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error obteniendo cliente' });
    }
  },

  createClient: async (req, res) => {
    try {
      const clientData = req.body;
      const mockClient = { id: Date.now(), ...clientData };
      res.status(201).json({ success: true, data: mockClient });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error creando cliente' });
    }
  },

  updateClient: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      res.json({ success: true, data: { id: parseInt(id), ...updateData } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error actualizando cliente' });
    }
  },

  deleteClient: async (req, res) => {
    try {
      const { id } = req.params;
      res.json({ success: true, message: `Cliente ${id} eliminado` });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error eliminando cliente' });
    }
  },

  getClientPackages: async (req, res) => {
    try {
      const { id } = req.params;
      const mockPackages = [
        { id: 1, trackingNumber: 'ITB001', status: 'delivered' },
        { id: 2, trackingNumber: 'ITB002', status: 'in_transit' }
      ];
      res.json({ success: true, data: mockPackages });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error obteniendo paquetes del cliente' });
    }
  },

  getClientProfile: async (req, res) => {
    try {
      const mockProfile = req.user || { id: 1, name: 'Cliente Demo', email: 'demo@client.com' };
      res.json({ success: true, data: mockProfile });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error obteniendo perfil' });
    }
  }
};

module.exports = clientController;