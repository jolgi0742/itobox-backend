// itobox-backend/src/routes/billingRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorize');
const billingController = require('../controllers/billingController');

// Invoice Management Routes
router.get('/invoices', authMiddleware, authorize(['admin', 'operator', 'client']), billingController.getInvoices);
router.post('/invoices', authMiddleware, authorize(['admin', 'operator']), billingController.createInvoice);
router.get('/invoices/:invoiceId', authMiddleware, authorize(['admin', 'operator', 'client']), billingController.getInvoiceDetails);
router.put('/invoices/:invoiceId', authMiddleware, authorize(['admin', 'operator']), billingController.updateInvoice);
router.delete('/invoices/:invoiceId', authMiddleware, authorize(['admin', 'operator']), billingController.deleteInvoice);

// Invoice Actions
router.post('/invoices/:invoiceId/send', authMiddleware, authorize(['admin', 'operator']), billingController.sendInvoice);
router.post('/invoices/:invoiceId/duplicate', authMiddleware, authorize(['admin', 'operator']), billingController.duplicateInvoice);
router.get('/invoices/:invoiceId/pdf', authMiddleware, authorize(['admin', 'operator', 'client']), billingController.downloadInvoicePDF);
router.post('/invoices/:invoiceId/void', authMiddleware, authorize(['admin', 'operator']), billingController.voidInvoice);

// Bulk Invoice Operations
router.post('/invoices/bulk-create', authMiddleware, authorize(['admin', 'operator']), billingController.bulkCreateInvoices);
router.post('/invoices/bulk-send', authMiddleware, authorize(['admin', 'operator']), billingController.bulkSendInvoices);
router.post('/invoices/bulk-void', authMiddleware, authorize(['admin', 'operator']), billingController.bulkVoidInvoices);

// Payment Processing Routes
router.post('/payments', authMiddleware, authorize(['admin', 'operator', 'client']), billingController.processPayment);
router.get('/payments', authMiddleware, authorize(['admin', 'operator']), billingController.getPayments);
router.get('/payments/:paymentId', authMiddleware, authorize(['admin', 'operator', 'client']), billingController.getPaymentDetails);
router.post('/payments/:paymentId/refund', authMiddleware, authorize(['admin', 'operator']), billingController.refundPayment);
router.post('/payments/:paymentId/void', authMiddleware, authorize(['admin', 'operator']), billingController.voidPayment);

// Payment Methods Management
router.get('/payment-methods', authMiddleware, authorize(['admin', 'operator', 'client']), billingController.getPaymentMethods);
router.post('/payment-methods', authMiddleware, authorize(['admin', 'operator', 'client']), billingController.addPaymentMethod);
router.put('/payment-methods/:methodId', authMiddleware, authorize(['admin', 'operator', 'client']), billingController.updatePaymentMethod);
router.delete('/payment-methods/:methodId', authMiddleware, authorize(['admin', 'operator', 'client']), billingController.deletePaymentMethod);
router.put('/payment-methods/:methodId/default', authMiddleware, authorize(['admin', 'operator', 'client']), billingController.setDefaultPaymentMethod);

// Recurring Billing
router.get('/subscriptions', authMiddleware, authorize(['admin', 'operator']), billingController.getSubscriptions);
router.post('/subscriptions', authMiddleware, authorize(['admin', 'operator']), billingController.createSubscription);
router.put('/subscriptions/:subscriptionId', authMiddleware, authorize(['admin', 'operator']), billingController.updateSubscription);
router.delete('/subscriptions/:subscriptionId', authMiddleware, authorize(['admin', 'operator']), billingController.cancelSubscription);
router.post('/subscriptions/:subscriptionId/pause', authMiddleware, authorize(['admin', 'operator']), billingController.pauseSubscription);
router.post('/subscriptions/:subscriptionId/resume', authMiddleware, authorize(['admin', 'operator']), billingController.resumeSubscription);

// Tax Management
router.get('/taxes', authMiddleware, authorize(['admin', 'operator']), billingController.getTaxRates);
router.post('/taxes', authMiddleware, authorize(['admin', 'operator']), billingController.createTaxRate);
router.put('/taxes/:taxId', authMiddleware, authorize(['admin', 'operator']), billingController.updateTaxRate);
router.delete('/taxes/:taxId', authMiddleware, authorize(['admin', 'operator']), billingController.deleteTaxRate);
router.post('/taxes/calculate', authMiddleware, authorize(['admin', 'operator', 'client']), billingController.calculateTax);

// Discount and Coupon Management
router.get('/discounts', authMiddleware, authorize(['admin', 'operator']), billingController.getDiscounts);
router.post('/discounts', authMiddleware, authorize(['admin', 'operator']), billingController.createDiscount);
router.put('/discounts/:discountId', authMiddleware, authorize(['admin', 'operator']), billingController.updateDiscount);
router.delete('/discounts/:discountId', authMiddleware, authorize(['admin', 'operator']), billingController.deleteDiscount);
router.post('/discounts/validate', authMiddleware, authorize(['admin', 'operator', 'client']), billingController.validateDiscount);

// Financial Reports
router.get('/reports/revenue', authMiddleware, authorize(['admin', 'operator']), billingController.getRevenueReport);
router.get('/reports/payments', authMiddleware, authorize(['admin', 'operator']), billingController.getPaymentsReport);
router.get('/reports/invoices', authMiddleware, authorize(['admin', 'operator']), billingController.getInvoicesReport);
router.get('/reports/taxes', authMiddleware, authorize(['admin', 'operator']), billingController.getTaxReport);
router.get('/reports/aged-receivables', authMiddleware, authorize(['admin', 'operator']), billingController.getAgedReceivablesReport);
router.get('/reports/client-statements', authMiddleware, authorize(['admin', 'operator']), billingController.getClientStatementsReport);

// Dashboard and Analytics
router.get('/dashboard/stats', authMiddleware, authorize(['admin', 'operator']), billingController.getBillingDashboardStats);
router.get('/dashboard/recent-activity', authMiddleware, authorize(['admin', 'operator']), billingController.getRecentBillingActivity);
router.get('/dashboard/revenue-trends', authMiddleware, authorize(['admin', 'operator']), billingController.getRevenueTrends);
router.get('/dashboard/payment-methods-stats', authMiddleware, authorize(['admin', 'operator']), billingController.getPaymentMethodsStats);

// Client-specific billing routes
router.get('/clients/:clientId/invoices', authMiddleware, authorize(['admin', 'operator', 'client']), billingController.getClientInvoices);
router.get('/clients/:clientId/payments', authMiddleware, authorize(['admin', 'operator', 'client']), billingController.getClientPayments);
router.get('/clients/:clientId/balance', authMiddleware, authorize(['admin', 'operator', 'client']), billingController.getClientBalance);
router.get('/clients/:clientId/statement', authMiddleware, authorize(['admin', 'operator', 'client']), billingController.getClientStatement);
router.post('/clients/:clientId/credit', authMiddleware, authorize(['admin', 'operator']), billingController.addClientCredit);

// Package-based billing
router.post('/packages/:packageId/calculate-charges', authMiddleware, authorize(['admin', 'operator', 'courier']), billingController.calculatePackageCharges);
router.post('/packages/:packageId/invoice', authMiddleware, authorize(['admin', 'operator']), billingController.createPackageInvoice);
router.get('/packages/:packageId/billing-history', authMiddleware, authorize(['admin', 'operator', 'client']), billingController.getPackageBillingHistory);

// Automated Billing
router.post('/automation/invoice-generation', authMiddleware, authorize(['admin', 'operator']), billingController.triggerAutomaticInvoicing);
router.get('/automation/settings', authMiddleware, authorize(['admin', 'operator']), billingController.getAutomationSettings);
router.put('/automation/settings', authMiddleware, authorize(['admin', 'operator']), billingController.updateAutomationSettings);

// Exchange Rates and Currency
router.get('/exchange-rates', authMiddleware, authorize(['admin', 'operator']), billingController.getExchangeRates);
router.post('/exchange-rates/update', authMiddleware, authorize(['admin', 'operator']), billingController.updateExchangeRates);
router.post('/currency/convert', authMiddleware, authorize(['admin', 'operator', 'client']), billingController.convertCurrency);

// Payment Gateway Integration
router.post('/gateways/stripe/webhook', billingController.handleStripeWebhook);
router.post('/gateways/paypal/webhook', billingController.handlePayPalWebhook);
router.post('/gateways/square/webhook', billingController.handleSquareWebhook);

// Configuration and Settings
router.get('/settings', authMiddleware, authorize(['admin', 'operator']), billingController.getBillingSettings);
router.put('/settings', authMiddleware, authorize(['admin', 'operator']), billingController.updateBillingSettings);
router.get('/settings/payment-gateways', authMiddleware, authorize(['admin', 'operator']), billingController.getPaymentGatewaySettings);
router.put('/settings/payment-gateways', authMiddleware, authorize(['admin', 'operator']), billingController.updatePaymentGatewaySettings);

// Invoice Templates
router.get('/templates', authMiddleware, authorize(['admin', 'operator']), billingController.getInvoiceTemplates);
router.post('/templates', authMiddleware, authorize(['admin', 'operator']), billingController.createInvoiceTemplate);
router.put('/templates/:templateId', authMiddleware, authorize(['admin', 'operator']), billingController.updateInvoiceTemplate);
router.delete('/templates/:templateId', authMiddleware, authorize(['admin', 'operator']), billingController.deleteInvoiceTemplate);
router.get('/templates/:templateId/preview', authMiddleware, authorize(['admin', 'operator']), billingController.previewInvoiceTemplate);

// Late Fees and Collections
router.get('/late-fees', authMiddleware, authorize(['admin', 'operator']), billingController.getLateFees);
router.post('/late-fees/calculate', authMiddleware, authorize(['admin', 'operator']), billingController.calculateLateFees);
router.post('/late-fees/apply', authMiddleware, authorize(['admin', 'operator']), billingController.applyLateFees);
router.get('/collections/overdue', authMiddleware, authorize(['admin', 'operator']), billingController.getOverdueInvoices);
router.post('/collections/send-reminders', authMiddleware, authorize(['admin', 'operator']), billingController.sendPaymentReminders);

// Credit Notes and Adjustments
router.get('/credit-notes', authMiddleware, authorize(['admin', 'operator']), billingController.getCreditNotes);
router.post('/credit-notes', authMiddleware, authorize(['admin', 'operator']), billingController.createCreditNote);
router.get('/credit-notes/:creditNoteId', authMiddleware, authorize(['admin', 'operator', 'client']), billingController.getCreditNoteDetails);
router.post('/credit-notes/:creditNoteId/apply', authMiddleware, authorize(['admin', 'operator']), billingController.applyCreditNote);

// Billing Disputes
router.get('/disputes', authMiddleware, authorize(['admin', 'operator']), billingController.getDisputes);
router.post('/disputes', authMiddleware, authorize(['admin', 'operator', 'client']), billingController.createDispute);
router.put('/disputes/:disputeId', authMiddleware, authorize(['admin', 'operator']), billingController.updateDispute);
router.post('/disputes/:disputeId/resolve', authMiddleware, authorize(['admin', 'operator']), billingController.resolveDispute);

// Audit and Compliance
router.get('/audit/trail', authMiddleware, authorize(['admin']), billingController.getBillingAuditTrail);
router.get('/compliance/tax-filings', authMiddleware, authorize(['admin', 'operator']), billingController.getTaxFilings);
router.post('/compliance/export-data', authMiddleware, authorize(['admin', 'operator']), billingController.exportComplianceData);

// Bulk Operations
router.post('/bulk/update-pricing', authMiddleware, authorize(['admin', 'operator']), billingController.bulkUpdatePricing);
router.post('/bulk/apply-discounts', authMiddleware, authorize(['admin', 'operator']), billingController.bulkApplyDiscounts);
router.post('/bulk/generate-statements', authMiddleware, authorize(['admin', 'operator']), billingController.bulkGenerateStatements);

// Integration Endpoints
router.post('/integrations/quickbooks/sync', authMiddleware, authorize(['admin', 'operator']), billingController.syncWithQuickBooks);
router.post('/integrations/xero/sync', authMiddleware, authorize(['admin', 'operator']), billingController.syncWithXero);
router.get('/integrations/status', authMiddleware, authorize(['admin', 'operator']), billingController.getIntegrationsStatus);

// Error handling middleware for billing routes
router.use((error, req, res, next) => {
  console.error('Billing Route Error:', error);
  
  // Handle specific billing errors
  if (error.type === 'payment_failed') {
    return res.status(402).json({
      success: false,
      message: 'El pago no pudo ser procesado',
      error: error.message
    });
  }
  
  if (error.type === 'invoice_not_found') {
    return res.status(404).json({
      success: false,
      message: 'Factura no encontrada'
    });
  }
  
  if (error.type === 'payment_method_invalid') {
    return res.status(400).json({
      success: false,
      message: 'Método de pago inválido'
    });
  }
  
  if (error.type === 'insufficient_funds') {
    return res.status(402).json({
      success: false,
      message: 'Fondos insuficientes'
    });
  }
  
  // Generic error handling
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor en el módulo de facturación'
  });
});

module.exports = router;