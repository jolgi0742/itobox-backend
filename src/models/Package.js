const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Package = sequelize.define('Package', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  packageCode: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'clients',
      key: 'id'
    }
  },
  prealertId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  trackingNumber: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  courier: {
    type: DataTypes.ENUM('UPS', 'FedEx', 'DHL', 'USPS', 'Other'),
    allowNull: false
  },
  originInfo: {
    type: DataTypes.JSON,
    allowNull: true
  },
  destinationInfo: {
    type: DataTypes.JSON,
    allowNull: false
  },
  packageDetails: {
    type: DataTypes.JSON,
    allowNull: false
  },
  customsInfo: {
    type: DataTypes.JSON,
    allowNull: true
  },
  shippingCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  insuranceValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'received', 'processing', 'in_transit', 'delivered', 'exception', 'returned'),
    defaultValue: 'pending'
  },
  priority: {
    type: DataTypes.ENUM('standard', 'express', 'urgent'),
    defaultValue: 'standard'
  },
  specialInstructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  photos: {
    type: DataTypes.JSON,
    allowNull: true
  },
  receivedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  estimatedDelivery: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'packages'
});

module.exports = Package;