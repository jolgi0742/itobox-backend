const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WHR = sequelize.define('WHR', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  whrNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'whr_number',
  },
  trackingNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'tracking_number',
  },
  arrivalDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'arrival_date',
  },
  receivedBy: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'received_by',
  },
  status: {
    type: DataTypes.ENUM('en Miami', 'por aire', 'por mar', 'en tránsito', 'entregado'),
    defaultValue: 'en Miami',
  },
  carrier: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  
  // Shipper Information
  shipperName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'shipper_name',
  },
  shipperCompany: {
    type: DataTypes.STRING,
    field: 'shipper_company',
  },
  shipperAddress: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'shipper_address',
  },
  shipperPhone: {
    type: DataTypes.STRING,
    field: 'shipper_phone',
  },
  
  // Consignee Information
  consigneeName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'consignee_name',
  },
  consigneeCompany: {
    type: DataTypes.STRING,
    field: 'consignee_company',
  },
  consigneeAddress: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'consignee_address',
  },
  consigneePhone: {
    type: DataTypes.STRING,
    field: 'consignee_phone',
  },
  consigneeEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
    field: 'consignee_email',
  },
  
  // Package Details
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  pieces: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  weight: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    comment: 'Peso en libras',
  },
  length: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    comment: 'Largo en pulgadas',
  },
  width: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    comment: 'Ancho en pulgadas',
  },
  height: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    comment: 'Alto en pulgadas',
  },
  volume: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
    comment: 'Volumen en pies cúbicos - Calculado automáticamente',
  },
  volumeWeight: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'volume_weight',
    comment: 'Volumen de peso (vlb) - Calculado automáticamente',
  },
  
  // Commercial Information
  invoiceNumber: {
    type: DataTypes.STRING,
    field: 'invoice_number',
  },
  declaredValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'declared_value',
  },
  poNumber: {
    type: DataTypes.STRING,
    field: 'po_number',
  },
  
  // Transport Information
  departureDate: {
    type: DataTypes.DATEONLY,
    field: 'departure_date',
  },
  transport: {
    type: DataTypes.ENUM('air', 'sea'),
    allowNull: false,
    defaultValue: 'air',
  },
  estimatedArrivalCR: {
    type: DataTypes.DATEONLY,
    field: 'estimated_arrival_cr',
  },
  
  // Classification and Status
  classification: {
    type: DataTypes.ENUM('pending', 'awb', 'bl'),
    defaultValue: 'pending',
  },
  emailSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'email_sent',
  },
  emailSentDate: {
    type: DataTypes.DATE,
    field: 'email_sent_date',
  },
  
  // Additional fields
  notes: {
    type: DataTypes.TEXT,
  },
  createdBy: {
    type: DataTypes.UUID,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'whrs',
  hooks: {
    beforeCreate: (whr) => {
      // Calculate volume using CAMCA formula
      whr.volume = (whr.length * whr.width * whr.height) * 0.000578746;
      // Calculate volume weight
      whr.volumeWeight = whr.volume * 10.4;
      
      // Generate WHR number if not provided
      if (!whr.whrNumber) {
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        whr.whrNumber = `WHR${year}${month}${day}${random}`;
      }
      
      // Calculate estimated arrival to CR if not provided
      if (whr.departureDate && !whr.estimatedArrivalCR) {
        const departure = new Date(whr.departureDate);
        const daysToAdd = whr.transport === 'air' ? 2 : 14;
        departure.setDate(departure.getDate() + daysToAdd);
        whr.estimatedArrivalCR = departure.toISOString().split('T')[0];
      }
    },
    beforeUpdate: (whr) => {
      // Recalculate volume if dimensions changed
      if (whr.changed('length') || whr.changed('width') || whr.changed('height')) {
        whr.volume = (whr.length * whr.width * whr.height) * 0.000578746;
        whr.volumeWeight = whr.volume * 10.4;
      }
      
      // Recalculate estimated arrival if transport or departure date changed
      if ((whr.changed('departureDate') || whr.changed('transport')) && whr.departureDate) {
        const departure = new Date(whr.departureDate);
        const daysToAdd = whr.transport === 'air' ? 2 : 14;
        departure.setDate(departure.getDate() + daysToAdd);
        whr.estimatedArrivalCR = departure.toISOString().split('T')[0];
      }
    },
  },
});

module.exports = WHR;
