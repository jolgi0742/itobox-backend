const { sequelize } = require('../config/database');
const User = require('./User');

// Importar otros modelos aquí cuando los creemos
// const Package = require('./Package');
// const Client = require('./Client');

const models = {
  User,
  // Package,
  // Client,
};

// Configurar asociaciones
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = {
  sequelize,
  ...models
};