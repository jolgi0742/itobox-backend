'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('demo123', salt);

    await queryInterface.bulkInsert('users', [
      {
        email: 'admin@demo.com',
        password: hashedPassword,
        role: 'admin',
        first_name: 'ITOBOX',
        last_name: 'Administrator',
        phone: '+506-2222-1111',
        company: 'ITOBOX Corp',
        is_email_verified: true,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        email: 'agente@demo.com',
        password: hashedPassword,
        role: 'agent',
        first_name: 'María',
        last_name: 'González',
        phone: '+506-2222-2222',
        company: 'ITOBOX Corp',
        is_email_verified: true,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        email: 'cliente@demo.com',
        password: hashedPassword,
        role: 'client',
        first_name: 'Juan',
        last_name: 'Pérez',
        phone: '+506-8888-9999',
        company: 'Mi Empresa S.A.',
        is_email_verified: true,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: ['admin@demo.com', 'agente@demo.com', 'cliente@demo.com']
    }, {});
  }
};
