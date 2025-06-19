// Obtener notificaciones del usuario
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    
    // Simulación de notificaciones
    const notifications = [
      {
        id: 1,
        title: 'Paquete entregado',
        message: 'Tu paquete PKG-001 ha sido entregado exitosamente',
        type: 'success',
        isRead: false,
        createdAt: '2025-05-31T14:30:00Z',
        data: {
          packageId: 'PKG-001',
          trackingNumber: 'TRK123456789'
        }
      },
      {
        id: 2,
        title: 'Nuevo paquete recibido',
        message: 'Hemos recibido tu paquete PKG-002 en nuestro almacén de Miami',
        type: 'info',
        isRead: true,
        createdAt: '2025-05-30T10:15:00Z',
        data: {
          packageId: 'PKG-002',
          trackingNumber: 'TRK987654321'
        }
      },
      {
        id: 3,
        title: 'Documentos requeridos',
        message: 'Se requieren documentos adicionales para el paquete PKG-003',
        type: 'warning',
        isRead: false,
        createdAt: '2025-05-29T16:45:00Z',
        data: {
          packageId: 'PKG-003'
        }
      }
    ];

    // Filtrar por no leídas si se solicita
    const filteredNotifications = unread === 'true' 
      ? notifications.filter(n => !n.isRead)
      : notifications;

    res.json({
      success: true,
      message: 'Notificaciones obtenidas exitosamente',
      data: {
        notifications: filteredNotifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredNotifications.length,
          pages: Math.ceil(filteredNotifications.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Marcar notificación como leída
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    res.json({
      success: true,
      message: `Notificación ${id} marcada como leída`,
      data: {
        id: parseInt(id),
        isRead: true,
        readAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error al marcar como leída:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Marcar todas las notificaciones como leídas
const markAllAsRead = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas',
      data: {
        updatedCount: 5,
        readAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error al marcar todas como leídas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Eliminar notificación
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    res.json({
      success: true,
      message: `Notificación ${id} eliminada exitosamente`
    });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Crear nueva notificación (solo admin/agent)
const createNotification = async (req, res) => {
  try {
    const { title, message, type, userId, data } = req.body;
    
    const notification = {
      id: Date.now(),
      title,
      message,
      type: type || 'info',
      userId: userId || req.user.id,
      isRead: false,
      createdAt: new Date().toISOString(),
      createdBy: req.user.id,
      data: data || {}
    };

    res.status(201).json({
      success: true,
      message: 'Notificación creada exitosamente',
      data: notification
    });
  } catch (error) {
    console.error('Error al crear notificación:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener contador de notificaciones no leídas
const getUnreadCount = async (req, res) => {
  try {
    // Simulación del contador
    const unreadCount = 3;
    
    res.json({
      success: true,
      message: 'Contador de notificaciones no leídas',
      data: {
        unreadCount,
        userId: req.user.id
      }
    });
  } catch (error) {
    console.error('Error al obtener contador:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  getUnreadCount
};