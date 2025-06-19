// itobox-backend/src/routes/clientPortalRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorize');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/clients/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen (JPG, PNG) o PDF'));
    }
  }
});

// Import controllers
const clientController = require('../controllers/clientController');
const packageController = require('../controllers/packageController');
const dashboardController = require('../controllers/dashboardController');

// Client Registration Routes
router.post('/register', upload.single('identificationFile'), clientController.registerClient);
router.post('/verify-email', clientController.verifyEmail);
router.post('/resend-verification', clientController.resendVerificationEmail);

// Client Dashboard Routes (Protected)
router.get('/:clientId/dashboard', authMiddleware, authorize(['client']), dashboardController.getClientDashboard);
router.get('/:clientId/stats', authMiddleware, authorize(['client']), dashboardController.getClientStats);
router.get('/:clientId/recent-activity', authMiddleware, authorize(['client']), dashboardController.getRecentActivity);

// Client Profile Routes
router.get('/:clientId/profile', authMiddleware, authorize(['client']), clientController.getClientProfile);
router.put('/:clientId/profile', authMiddleware, authorize(['client']), upload.single('profileImage'), clientController.updateClientProfile);
router.put('/:clientId/password', authMiddleware, authorize(['client']), clientController.changePassword);

// Mailbox Information
router.get('/:clientId/mailbox', authMiddleware, authorize(['client']), clientController.getMailboxInfo);
router.post('/:clientId/mailbox/activate', authMiddleware, authorize(['client']), clientController.activateMailbox);

// Pre-alerts Routes
router.get('/:clientId/prealerts', authMiddleware, authorize(['client']), packageController.getClientPrealerts);
router.post('/:clientId/prealerts', authMiddleware, authorize(['client']), packageController.createPrealert);
router.put('/:clientId/prealerts/:prealertId', authMiddleware, authorize(['client']), packageController.updatePrealert);
router.delete('/:clientId/prealerts/:prealertId', authMiddleware, authorize(['client']), packageController.deletePrealert);
router.get('/:clientId/prealerts/:prealertId', authMiddleware, authorize(['client']), packageController.getPrealertDetails);

// Packages Routes
router.get('/:clientId/packages', authMiddleware, authorize(['client']), packageController.getClientPackages);
router.get('/:clientId/packages/:packageId', authMiddleware, authorize(['client']), packageController.getPackageDetails);
router.put('/:clientId/packages/:packageId/delivery-address', authMiddleware, authorize(['client']), packageController.updateDeliveryAddress);
router.post('/:clientId/packages/:packageId/consolidate', authMiddleware, authorize(['client']), packageController.requestConsolidation);

// Shipping Requests
router.post('/:clientId/shipping-requests', authMiddleware, authorize(['client']), packageController.createShippingRequest);
router.get('/:clientId/shipping-requests', authMiddleware, authorize(['client']), packageController.getShippingRequests);
router.put('/:clientId/shipping-requests/:requestId', authMiddleware, authorize(['client']), packageController.updateShippingRequest);
router.delete('/:clientId/shipping-requests/:requestId', authMiddleware, authorize(['client']), packageController.cancelShippingRequest);

// Tracking Routes
router.get('/:clientId/tracking', authMiddleware, authorize(['client']), packageController.getClientTrackingInfo);
router.get('/:clientId/tracking/:trackingNumber', authMiddleware, authorize(['client']), packageController.getTrackingDetails);

// Address Book Routes
router.get('/:clientId/addresses', authMiddleware, authorize(['client']), clientController.getClientAddresses);
router.post('/:clientId/addresses', authMiddleware, authorize(['client']), clientController.addClientAddress);
router.put('/:clientId/addresses/:addressId', authMiddleware, authorize(['client']), clientController.updateClientAddress);
router.delete('/:clientId/addresses/:addressId', authMiddleware, authorize(['client']), clientController.deleteClientAddress);
router.put('/:clientId/addresses/:addressId/default', authMiddleware, authorize(['client']), clientController.setDefaultAddress);

// Documents Routes
router.get('/:clientId/documents', authMiddleware, authorize(['client']), clientController.getClientDocuments);
router.post('/:clientId/documents', authMiddleware, authorize(['client']), upload.single('document'), clientController.uploadDocument);
router.get('/:clientId/documents/:documentId/download', authMiddleware, authorize(['client']), clientController.downloadDocument);
router.delete('/:clientId/documents/:documentId', authMiddleware, authorize(['client']), clientController.deleteDocument);

// Invoices and Billing (Integration with billing module)
router.get('/:clientId/invoices', authMiddleware, authorize(['client']), require('../controllers/billingController').getClientInvoices);
router.get('/:clientId/invoices/:invoiceId', authMiddleware, authorize(['client']), require('../controllers/billingController').getInvoiceDetails);
router.post('/:clientId/invoices/:invoiceId/pay', authMiddleware, authorize(['client']), require('../controllers/billingController').payInvoice);

// Payment Methods
router.get('/:clientId/payment-methods', authMiddleware, authorize(['client']), require('../controllers/billingController').getClientPaymentMethods);
router.post('/:clientId/payment-methods', authMiddleware, authorize(['client']), require('../controllers/billingController').addPaymentMethod);
router.put('/:clientId/payment-methods/:methodId', authMiddleware, authorize(['client']), require('../controllers/billingController').updatePaymentMethod);
router.delete('/:clientId/payment-methods/:methodId', authMiddleware, authorize(['client']), require('../controllers/billingController').deletePaymentMethod);
router.put('/:clientId/payment-methods/:methodId/default', authMiddleware, authorize(['client']), require('../controllers/billingController').setDefaultPaymentMethod);

// Notifications Preferences
router.get('/:clientId/notification-preferences', authMiddleware, authorize(['client']), clientController.getNotificationPreferences);
router.put('/:clientId/notification-preferences', authMiddleware, authorize(['client']), clientController.updateNotificationPreferences);

// Support and Help
router.post('/:clientId/support/tickets', authMiddleware, authorize(['client']), clientController.createSupportTicket);
router.get('/:clientId/support/tickets', authMiddleware, authorize(['client']), clientController.getSupportTickets);
router.get('/:clientId/support/tickets/:ticketId', authMiddleware, authorize(['client']), clientController.getSupportTicketDetails);
router.post('/:clientId/support/tickets/:ticketId/messages', authMiddleware, authorize(['client']), clientController.addTicketMessage);

// Rate Calculator (Public or Protected)
router.post('/calculate-shipping', packageController.calculateShippingRate);
router.get('/shipping-options', packageController.getShippingOptions);

// Referrals Program
router.get('/:clientId/referrals', authMiddleware, authorize(['client']), clientController.getClientReferrals);
router.post('/:clientId/referrals', authMiddleware, authorize(['client']), clientController.createReferral);
router.get('/:clientId/referrals/stats', authMiddleware, authorize(['client']), clientController.getReferralStats);

// Loyalty Program
router.get('/:clientId/loyalty', authMiddleware, authorize(['client']), clientController.getLoyaltyInfo);
router.get('/:clientId/loyalty/history', authMiddleware, authorize(['client']), clientController.getLoyaltyHistory);
router.post('/:clientId/loyalty/redeem', authMiddleware, authorize(['client']), clientController.redeemLoyaltyPoints);

// Client Activity Logs
router.get('/:clientId/activity-log', authMiddleware, authorize(['client']), clientController.getActivityLog);

// Export/Import Client Data
router.get('/:clientId/export-data', authMiddleware, authorize(['client']), clientController.exportClientData);

// Account Deactivation
router.post('/:clientId/deactivate', authMiddleware, authorize(['client']), clientController.deactivateAccount);
router.post('/:clientId/reactivate', authMiddleware, authorize(['client', 'admin']), clientController.reactivateAccount);

// Error handling middleware for this router
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        message: 'El archivo es demasiado grande. Máximo 10MB.' 
      });
    }
  }
  
  if (error.message.includes('Solo se permiten archivos')) {
    return res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
  
  console.error('Client Portal Route Error:', error);
  res.status(500).json({ 
    success: false, 
    message: 'Error interno del servidor' 
  });
});

module.exports = router;