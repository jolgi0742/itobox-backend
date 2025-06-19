'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('clients', [
      {
        customer_code: 'CLI-001',
        contact_person: 'Juan Pérez',
        phone: '+506-8888-9999',
        company_name: 'Mi Empresa S.A.',
        address: JSON.stringify({
          street: 'Avenida Central 123',
          city: 'San José',
          state: 'San José',
          zipCode: '10101',
          country: 'Costa Rica'
        }),
        miami_address: JSON.stringify({
          line1: '1234 Shipping Way',
          line2: 'Suite 100',
          city: 'Miami',
          state: 'FL',
          zipCode: '33101',
          suite: 'CLI-001'
        }),
        preferences: JSON.stringify({
          shippingMethod: 'air',
          consolidation: true,
          insuranceOptIn: true,
          customsDeclaration: 'commercial'
        }),
        credit_limit: 5000.00,
        current_balance: -150.75,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        customer_code: 'CLI-002',
        contact_person: 'Ana Torres',
        phone: '+506-7777-8888',
        company_name: 'Torres Import',
        address: JSON.stringify({
          street: 'Calle 5 Avenida 10',
          city: 'Cartago',
          state: 'Cartago',
          zipCode: '30101',
          country: 'Costa Rica'
        }),
        miami_address: JSON.stringify({
          line1: '1234 Shipping Way',
          line2: 'Suite 100',
          city: 'Miami',
          state: 'FL',
          zipCode: '33101',
          suite: 'CLI-002'
        }),
        preferences: JSON.stringify({
          shippingMethod: 'sea',
          consolidation: false,
          insuranceOptIn: false,
          customsDeclaration: 'personal'
        }),
        credit_limit: 3000.00,
        current_balance: 250.00,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        customer_code: 'CLI-003',
        contact_person: 'Carlos Rodríguez',
        phone: '+506-6666-7777',
        company_name: 'TechCR Solutions',
        address: JSON.stringify({
          street: 'Escazú Corporate Center',
          city: 'Escazú',
          state: 'San José',
          zipCode: '10203',
          country: 'Costa Rica'
        }),
        miami_address: JSON.stringify({
          line1: '1234 Shipping Way',
          line2: 'Suite 100',
          city: 'Miami',
          state: 'FL',
          zipCode: '33101',
          suite: 'CLI-003'
        }),
        preferences: JSON.stringify({
          shippingMethod: 'express',
          consolidation: true,
          insuranceOptIn: true,
          customsDeclaration: 'commercial'
        }),
        credit_limit: 10000.00,
        current_balance: -500.25,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('clients', {
      customer_code: ['CLI-001', 'CLI-002', 'CLI-003']
    }, {});
  }
};