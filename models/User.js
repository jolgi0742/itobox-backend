const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [6, 255]
    }
  },
  company: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^[\+]?[0-9\s\-\(\)]*$/
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'user', 'client'),
    allowNull: false,
    defaultValue: 'user'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  preferences: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      language: 'es',
      theme: 'light',
      notifications: true
    }
  }
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['role']
    },
    {
      fields: ['isActive']
    }
  ],
  hooks: {
    beforeValidate: (user) => {
      // Limpiar y normalizar datos
      if (user.email) {
        user.email = user.email.toLowerCase().trim();
      }
      if (user.firstName) {
        user.firstName = user.firstName.trim();
      }
      if (user.lastName) {
        user.lastName = user.lastName.trim();
      }
    }
  }
});

// Métodos de instancia
User.prototype.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password; // Nunca exponer password
  return values;
};

// Métodos estáticos
User.associate = function(models) {
  // Asociaciones con otros modelos (definir más tarde)
  // User.hasMany(models.Package, { foreignKey: 'userId' });
  // User.hasMany(models.Client, { foreignKey: 'userId' });
};

module.exports = User;