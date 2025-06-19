// Rastrear paquete por ID
const trackPackage = async (req, res) => {
  try {
    const { packageId } = req.params;
    res.json({
      success: true,
      message: `Información de tracking del paquete ${packageId}`,
      data: {
        packageId,
        status: 'en_transito',
        currentLocation: 'Miami, FL',
        estimatedDelivery: '2025-06-05',
        events: [
          {
            date: '2025-05-31',
            time: '14:30',
            status: 'recibido',
            location: 'Miami, FL',
            description: 'Paquete recibido en almacén'
          }
        ]
      }
    });
  } catch (error) {
    console.error('Error al rastrear paquete:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener historial completo de tracking
const getTrackingHistory = async (req, res) => {
  try {
    const { packageId } = req.params;
    res.json({
      success: true,
      message: `Historial completo del paquete ${packageId}`,
      data: {
        packageId,
        events: [
          {
            id: 1,
            date: '2025-05-30',
            time: '10:00',
            status: 'pre_alerta',
            location: 'Sistema',
            description: 'Pre-alerta creada por el cliente'
          },
          {
            id: 2,
            date: '2025-05-31',
            time: '14:30',
            status: 'recibido',
            location: 'Miami, FL',
            description: 'Paquete recibido en almacén'
          }
        ]
      }
    });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Actualizar estado de tracking (solo admin/agent)
const updateTrackingStatus = async (req, res) => {
  try {
    const { packageId } = req.params;
    const { status, location, description } = req.body;
    
    res.json({
      success: true,
      message: 'Estado de tracking actualizado exitosamente',
      data: {
        packageId,
        newStatus: status,
        location,
        description,
        updatedBy: req.user.email,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error al actualizar tracking:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Tracking público (sin autenticación)
const getPublicTracking = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    res.json({
      success: true,
      message: `Información pública del tracking ${trackingNumber}`,
      data: {
        trackingNumber,
        status: 'en_transito',
        currentLocation: 'Miami, FL',
        estimatedDelivery: '2025-06-05',
        lastUpdate: '2025-05-31 14:30:00',
        events: [
          {
            date: '2025-05-31',
            time: '14:30',
            status: 'recibido',
            location: 'Miami, FL',
            description: 'Paquete recibido en almacén'
          }
        ]
      }
    });
  } catch (error) {
    console.error('Error en tracking público:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Agregar evento de tracking
const addTrackingEvent = async (req, res) => {
  try {
    const { packageId } = req.params;
    const { status, location, description } = req.body;
    
    res.status(201).json({
      success: true,
      message: 'Evento de tracking agregado exitosamente',
      data: {
        packageId,
        event: {
          id: Date.now(),
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('es-ES', { hour12: false }).substring(0, 5),
          status,
          location,
          description,
          createdBy: req.user.email
        }
      }
    });
  } catch (error) {
    console.error('Error al agregar evento:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  trackPackage,
  getTrackingHistory,
  updateTrackingStatus,
  getPublicTracking,
  addTrackingEvent
};